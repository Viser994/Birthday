package com.iamlab.saml.saml;

import com.iamlab.saml.config.IamLabProperties;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AuthnRequestFactory {
  private final IamLabProperties properties;

  public AuthnRequestFactory(IamLabProperties properties) {
    this.properties = properties;
  }

  public record BuiltRequest(String id, String issueInstant, String xml) {}

  public BuiltRequest build(boolean forceAuthn) {
    String id = "_" + UUID.randomUUID();
    String issueInstant = Instant.now().toString();
    String xml =
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                            ID="%s"
                            Version="2.0"
                            IssueInstant="%s"
                            Destination="%s"
                            AssertionConsumerServiceURL="%s"
                            ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                            ForceAuthn="%s">
          <saml:Issuer>%s</saml:Issuer>
          <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                             AllowCreate="true"/>
        </samlp:AuthnRequest>
        """
            .formatted(
                id,
                issueInstant,
                properties.getIdp().getSsoUrl(),
                properties.getSp().getAcsUrl(),
                forceAuthn,
                properties.getSp().getEntityId());
    return new BuiltRequest(id, issueInstant, xml.trim());
  }
}
