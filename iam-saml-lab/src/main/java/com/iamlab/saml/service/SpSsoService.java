package com.iamlab.saml.service;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.domain.FlowTrace;
import com.iamlab.saml.saml.AuthnRequestFactory;
import com.iamlab.saml.saml.SamlCodec;
import com.iamlab.saml.saml.SamlResponseParser;
import com.iamlab.saml.store.LabStore;
import com.iamlab.saml.store.LabStore.PendingAuthn;
import com.iamlab.saml.store.LabStore.SpSession;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SpSsoService {
  private final IamLabProperties properties;
  private final LabStore store;
  private final AuthnRequestFactory authnRequestFactory;
  private final SamlCodec codec;
  private final SamlResponseParser parser;

  public SpSsoService(
      IamLabProperties properties,
      LabStore store,
      AuthnRequestFactory authnRequestFactory,
      SamlCodec codec,
      SamlResponseParser parser) {
    this.properties = properties;
    this.store = store;
    this.authnRequestFactory = authnRequestFactory;
    this.codec = codec;
    this.parser = parser;
  }

  public Map<String, Object> beginSso(String relayState, boolean forceAuthn) {
    FlowTrace flow = store.newFlow();
    flow.setRelayState(relayState);
    flow.setStatus("AUTHN_REQUEST_CREATED");

    AuthnRequestFactory.BuiltRequest request = authnRequestFactory.build(forceAuthn);
    String encoded = codec.encodeRedirect(request.xml());
    String redirectUrl =
        properties.getIdp().getSsoUrl()
            + "?SAMLRequest="
            + URLEncoder.encode(encoded, StandardCharsets.UTF_8)
            + "&RelayState="
            + URLEncoder.encode(relayState == null ? "" : relayState, StandardCharsets.UTF_8)
            + "&flowId="
            + URLEncoder.encode(flow.getFlowId(), StandardCharsets.UTF_8);

    store.savePending(
        new PendingAuthn(
            request.id(), flow.getFlowId(), relayState, request.xml(), Instant.now()));

    Map<String, Object> parsed = parser.parseAuthnRequest(request.xml());
    flow.addStep(
        "SP",
        "User requested a protected resource",
        "No SP session found. Starting SAML Web Browser SSO.",
        Map.of("relayState", relayState == null ? "" : relayState, "forceAuthn", forceAuthn));
    flow.addStep(
        "SP",
        "Built AuthnRequest",
        "SP created a SAML AuthnRequest identifying itself as Issuer and naming the ACS callback.",
        Map.of(
            "requestId",
            request.id(),
            "binding",
            "HTTP-Redirect",
            "parsed",
            parsed,
            "xmlPretty",
            codec.prettyXml(request.xml())));

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("flowId", flow.getFlowId());
    result.put("requestId", request.id());
    result.put("authnRequestXml", request.xml());
    result.put("authnRequestPretty", codec.prettyXml(request.xml()));
    result.put("samlRequestEncoded", encoded);
    result.put("redirectUrl", redirectUrl);
    result.put("relayState", relayState);
    result.put("parsed", parsed);
    result.put(
        "explain",
        "The browser will be redirected to the IdP with a compressed+Base64 SAMLRequest query parameter.");
    return result;
  }

  public SpSession consumeResponse(String samlResponseB64, String relayState, String flowId) {
    String xml = codec.decodePost(samlResponseB64);
    Map<String, Object> parsed = parser.parse(xml);

    FlowTrace flow = null;
    if (flowId != null && !flowId.isBlank()) {
      flow = store.findFlow(flowId).orElse(null);
    }
    if (flow == null) {
      flow =
          store
              .findPending(String.valueOf(parsed.get("inResponseTo")))
              .flatMap(p -> store.findFlow(p.flowId()))
              .orElseGet(store::newFlow);
    }

    flow.addStep(
        "SP",
        "Received SAMLResponse at ACS",
        "Browser POSTed the Base64 SAMLResponse to the Assertion Consumer Service.",
        Map.of(
            "binding",
            "HTTP-POST",
            "relayState",
            relayState == null ? "" : relayState,
            "xmlPretty",
            codec.prettyXml(xml),
            "parsed",
            parsed));

    if (!Boolean.TRUE.equals(parsed.get("success"))) {
      flow.setStatus("FAILED");
      flow.addStep("SP", "Rejected response", "Status was not Success.", Map.of("status", parsed.get("status")));
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "SAML status was not Success");
    }

    String audience = String.valueOf(parsed.get("audience"));
    if (!properties.getSp().getEntityId().equals(audience)) {
      flow.setStatus("FAILED");
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Audience mismatch");
    }

    @SuppressWarnings("unchecked")
    Map<String, String> attributes = (Map<String, String>) parsed.get("attributes");
    String nameId = String.valueOf(parsed.get("nameId"));
    SpSession session = store.createSpSession(nameId, attributes, flow.getFlowId());
    flow.setSubject(nameId);
    flow.setStatus("SSO_COMPLETE");
    flow.setRelayState(relayState);
    flow.addStep(
        "SP",
        "Created application session",
        "Assertion accepted. Attributes mapped into a local SP session cookie.",
        Map.of("session", session.toView()));

    return session;
  }

  public Map<String, Object> sessionView(String token) {
    return store
        .findSpSession(token)
        .map(SpSession::toView)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No SP session"));
  }
}
