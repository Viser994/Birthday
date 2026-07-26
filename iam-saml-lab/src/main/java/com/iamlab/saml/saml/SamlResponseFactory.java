package com.iamlab.saml.saml;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.domain.DemoUser;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class SamlResponseFactory {
  private final IamLabProperties properties;

  public SamlResponseFactory(IamLabProperties properties) {
    this.properties = properties;
  }

  public record BuiltResponse(String responseId, String assertionId, String xml) {}

  public BuiltResponse build(DemoUser user, String inResponseTo, String audience) {
    String responseId = "_" + UUID.randomUUID();
    String assertionId = "_" + UUID.randomUUID();
    Instant now = Instant.now();
    Instant notOnOrAfter = now.plus(5, ChronoUnit.MINUTES);
    String sessionIndex = "session-" + UUID.randomUUID();

    String attributeStatements =
        user.samlAttributes().entrySet().stream()
            .map(this::attributeXml)
            .collect(Collectors.joining("\n          "));

    String xml =
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                        ID="%s"
                        Version="2.0"
                        IssueInstant="%s"
                        Destination="%s"
                        InResponseTo="%s">
          <saml:Issuer>%s</saml:Issuer>
          <samlp:Status>
            <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
          </samlp:Status>
          <saml:Assertion ID="%s" Version="2.0" IssueInstant="%s">
            <saml:Issuer>%s</saml:Issuer>
            <saml:Subject>
              <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">%s</saml:NameID>
              <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
                <saml:SubjectConfirmationData NotOnOrAfter="%s"
                                              Recipient="%s"
                                              InResponseTo="%s"/>
              </saml:SubjectConfirmation>
            </saml:Subject>
            <saml:Conditions NotBefore="%s" NotOnOrAfter="%s">
              <saml:AudienceRestriction>
                <saml:Audience>%s</saml:Audience>
              </saml:AudienceRestriction>
            </saml:Conditions>
            <saml:AuthnStatement AuthnInstant="%s" SessionIndex="%s">
              <saml:AuthnContext>
                <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
              </saml:AuthnContext>
            </saml:AuthnStatement>
            <saml:AttributeStatement>
              %s
            </saml:AttributeStatement>
          </saml:Assertion>
        </samlp:Response>
        """
            .formatted(
                responseId,
                now,
                properties.getSp().getAcsUrl(),
                inResponseTo,
                properties.getIdp().getEntityId(),
                assertionId,
                now,
                properties.getIdp().getEntityId(),
                escape(user.getEmail()),
                notOnOrAfter,
                properties.getSp().getAcsUrl(),
                inResponseTo,
                now.minus(1, ChronoUnit.MINUTES),
                notOnOrAfter,
                audience,
                now,
                sessionIndex,
                attributeStatements);

    return new BuiltResponse(responseId, assertionId, xml.trim());
  }

  private String attributeXml(Map.Entry<String, String> entry) {
    return """
        <saml:Attribute Name="%s" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
                    <saml:AttributeValue>%s</saml:AttributeValue>
                  </saml:Attribute>"""
        .formatted(escape(entry.getKey()), escape(entry.getValue()));
  }

  private static String escape(String value) {
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
