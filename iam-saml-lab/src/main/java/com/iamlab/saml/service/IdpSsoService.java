package com.iamlab.saml.service;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.domain.DemoUser;
import com.iamlab.saml.domain.FlowTrace;
import com.iamlab.saml.saml.SamlCodec;
import com.iamlab.saml.saml.SamlResponseFactory;
import com.iamlab.saml.saml.SamlResponseParser;
import com.iamlab.saml.store.LabStore;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdpSsoService {
  private final IamLabProperties properties;
  private final LabStore store;
  private final SamlCodec codec;
  private final SamlResponseFactory responseFactory;
  private final SamlResponseParser parser;

  public IdpSsoService(
      IamLabProperties properties,
      LabStore store,
      SamlCodec codec,
      SamlResponseFactory responseFactory,
      SamlResponseParser parser) {
    this.properties = properties;
    this.store = store;
    this.codec = codec;
    this.responseFactory = responseFactory;
    this.parser = parser;
  }

  public Map<String, Object> inspectIncomingRequest(
      String samlRequestEncoded, String relayState, String flowId) {
    String xml = codec.decodeRedirect(samlRequestEncoded);
    Map<String, Object> parsed = parser.parseAuthnRequest(xml);

    FlowTrace flow =
        Optional.ofNullable(flowId)
            .flatMap(store::findFlow)
            .orElseGet(
                () ->
                    store
                        .findPending(String.valueOf(parsed.get("id")))
                        .flatMap(p -> store.findFlow(p.flowId()))
                        .orElseGet(store::newFlow));

    flow.setStatus("AT_IDP");
    flow.setRelayState(relayState);
    flow.addStep(
        "IdP",
        "Received AuthnRequest",
        "IdP decoded the Redirect-bound SAMLRequest and will authenticate the user.",
        Map.of(
            "parsed",
            parsed,
            "relayState",
            relayState == null ? "" : relayState,
            "xmlPretty",
            codec.prettyXml(xml)));

    Map<String, Object> view = new LinkedHashMap<>();
    view.put("flowId", flow.getFlowId());
    view.put("authnRequestXml", xml);
    view.put("authnRequestPretty", codec.prettyXml(xml));
    view.put("parsed", parsed);
    view.put("relayState", relayState);
    view.put("requestId", parsed.get("id"));
    view.put("acsUrl", parsed.get("acsUrl"));
    view.put("demoUsers", store.listUsersPublic());
    view.put("demoHint", properties.getDemo().getHint());
    return view;
  }

  public Map<String, Object> issueResponse(
      String username,
      String password,
      String requestId,
      String relayState,
      String flowId,
      String existingIdpSession) {

    DemoUser user;
    if (existingIdpSession != null && !existingIdpSession.isBlank()) {
      user =
          store
              .findIdpUsername(existingIdpSession)
              .flatMap(store::findUser)
              .orElseThrow(
                  () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "IdP session expired"));
    } else {
      user =
          store
              .authenticate(username, password)
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.UNAUTHORIZED, "Invalid username or password"));
    }

    FlowTrace flow =
        Optional.ofNullable(flowId)
            .flatMap(store::findFlow)
            .or(() -> store.findPending(requestId).flatMap(p -> store.findFlow(p.flowId())))
            .orElseGet(store::newFlow);

    if (existingIdpSession == null || existingIdpSession.isBlank()) {
      flow.addStep(
          "IdP",
          "User authenticated at IdP",
          "Credentials verified. In production this may include MFA, risk checks, or SSO cookie reuse.",
          Map.of(
              "username",
              user.getUsername(),
              "email",
              user.getEmail(),
              "groups",
              user.getGroups()));
    } else {
      flow.addStep(
          "IdP",
          "Reused existing IdP session",
          "User already had an IdP SSO cookie, so password prompt was skipped (SSO).",
          Map.of("username", user.getUsername()));
    }

    SamlResponseFactory.BuiltResponse built =
        responseFactory.build(user, requestId, properties.getSp().getEntityId());
    String encoded = codec.encodePost(built.xml());
    Map<String, Object> parsed = parser.parse(built.xml());

    flow.setStatus("RESPONSE_ISSUED");
    flow.setSubject(user.getEmail());
    flow.addStep(
        "IdP",
        "Issued SAML Response + Assertion",
        "IdP created a Success response with NameID and AttributeStatement for the SP.",
        Map.of(
            "responseId",
            built.responseId(),
            "assertionId",
            built.assertionId(),
            "binding",
            "HTTP-POST",
            "acsUrl",
            properties.getSp().getAcsUrl(),
            "parsed",
            parsed,
            "xmlPretty",
            codec.prettyXml(built.xml())));

    String idpToken =
        (existingIdpSession != null && !existingIdpSession.isBlank())
            ? existingIdpSession
            : store.createIdpSession(user.getUsername());

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("flowId", flow.getFlowId());
    result.put("acsUrl", properties.getSp().getAcsUrl());
    result.put("samlResponse", encoded);
    result.put("relayState", relayState);
    result.put("responseXml", built.xml());
    result.put("responsePretty", codec.prettyXml(built.xml()));
    result.put("parsed", parsed);
    result.put("idpSessionToken", idpToken);
    result.put(
        "explain",
        "The IdP returns an HTML form that auto-POSTs SAMLResponse to the SP ACS (HTTP-POST binding).");
    return result;
  }
}
