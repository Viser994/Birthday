package com.iamlab.saml.service;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.store.LabStore;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class LearningGuideService {
  private final IamLabProperties properties;
  private final LabStore store;

  public LearningGuideService(IamLabProperties properties, LabStore store) {
    this.properties = properties;
    this.store = store;
  }

  public Map<String, Object> overview() {
    Map<String, Object> guide = new LinkedHashMap<>();
    guide.put("app", properties.getAppName());
    guide.put(
        "goal",
        "Learn IAM by walking a real SAML 2.0 Web Browser SSO flow between a Service Provider (SP) and Identity Provider (IdP).");
    guide.put("demoHint", properties.getDemo().getHint());
    guide.put(
        "actors",
        List.of(
            Map.of(
                "role",
                "Service Provider (SP)",
                "name",
                "Acme Learning App",
                "entityId",
                properties.getSp().getEntityId(),
                "job",
                "Protects an app resource and consumes SAML Responses at its ACS URL."),
            Map.of(
                "role",
                "Identity Provider (IdP)",
                "name",
                "Campus IdP",
                "entityId",
                properties.getIdp().getEntityId(),
                "job",
                "Authenticates the user and issues a signed SAML Assertion about that user.")));
    guide.put(
        "concepts",
        List.of(
            concept(
                "IAM",
                "Identity and Access Management — who someone is, what they can do, and how that is proven."),
            concept(
                "Federation",
                "Trust between systems so one IdP can authenticate users for many SPs."),
            concept(
                "SAML 2.0",
                "Security Assertion Markup Language — XML messages that carry authentication and attributes."),
            concept(
                "AuthnRequest",
                "SP asks the IdP: please authenticate this browser user and send me an assertion."),
            concept(
                "Assertion",
                "IdP statement: this NameID authenticated at time T, with these attributes."),
            concept(
                "Binding",
                "How a SAML message rides on HTTP — Redirect (GET + deflate) or POST (form + base64)."),
            concept(
                "ACS",
                "Assertion Consumer Service — SP endpoint that receives the SAMLResponse."),
            concept(
                "RelayState",
                "Opaque value the SP sends and gets back — usually the deep link to reopen after login."),
            concept(
                "NameID",
                "Subject identifier in the assertion (often email or a persistent opaque ID).")));
    guide.put(
        "flowSteps",
        List.of(
            step(1, "User hits protected page", "SP sees no session and starts SSO."),
            step(2, "SP builds AuthnRequest", "XML AuthnRequest is created with Issuer + ACS URL."),
            step(3, "Redirect binding to IdP", "Browser is sent to IdP SSO with SAMLRequest + RelayState."),
            step(4, "User logs in at IdP", "IdP authenticates (password, MFA, etc. in real life)."),
            step(5, "IdP builds SAML Response", "Contains Status=Success and an Assertion with attributes."),
            step(6, "POST binding to ACS", "Browser auto-POSTs SAMLResponse back to the SP."),
            step(7, "SP validates & creates session", "Checks audience/recipient/status, maps attributes, opens app session.")));
    guide.put("demoUsers", store.listUsersPublic());
    guide.put(
        "tryThis",
        List.of(
            "Click Start SSO and watch each step appear in the flow timeline.",
            "Open the AuthnRequest XML — find Issuer, Destination, and ACS URL.",
            "Log in as alice, then inspect NameID and AttributeStatement in the Response.",
            "Visit /sp/app — you should see the federated session created from the assertion.",
            "Logout of SP and IdP separately to see the difference between app session and IdP session."));
    return guide;
  }

  private static Map<String, String> concept(String term, String meaning) {
    return Map.of("term", term, "meaning", meaning);
  }

  private static Map<String, Object> step(int n, String title, String detail) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("n", n);
    m.put("title", title);
    m.put("detail", detail);
    return m;
  }
}
