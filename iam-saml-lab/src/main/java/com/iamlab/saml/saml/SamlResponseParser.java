package com.iamlab.saml.saml;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Lightweight educational parser — extracts the fields learners need to inspect.
 * Production SAML uses a full XML + signature stack (OpenSAML, Spring Security SAML).
 */
@Component
public class SamlResponseParser {

  public Map<String, Object> parse(String xml) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("responseId", attr(xml, "Response", "ID"));
    result.put("inResponseTo", attr(xml, "Response", "InResponseTo"));
    result.put("destination", attr(xml, "Response", "Destination"));
    result.put("issuer", tagText(xml, "Issuer"));
    result.put("status", statusCode(xml));
    result.put("nameId", tagText(xml, "NameID"));
    result.put("audience", tagText(xml, "Audience"));
    result.put("sessionIndex", attr(xml, "AuthnStatement", "SessionIndex"));
    result.put("authnContext", tagText(xml, "AuthnContextClassRef"));
    result.put("attributes", attributes(xml));
    result.put("success", "Success".equals(String.valueOf(result.get("status"))));
    return result;
  }

  public Map<String, Object> parseAuthnRequest(String xml) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("id", attr(xml, "AuthnRequest", "ID"));
    result.put("destination", attr(xml, "AuthnRequest", "Destination"));
    result.put("acsUrl", attr(xml, "AuthnRequest", "AssertionConsumerServiceURL"));
    result.put("forceAuthn", attr(xml, "AuthnRequest", "ForceAuthn"));
    result.put("issuer", tagText(xml, "Issuer"));
    result.put("nameIdFormat", attr(xml, "NameIDPolicy", "Format"));
    return result;
  }

  private Map<String, String> attributes(String xml) {
    Map<String, String> attrs = new LinkedHashMap<>();
    Pattern p =
        Pattern.compile(
            "<saml:Attribute[^>]*Name=\"([^\"]+)\"[^>]*>\\s*<saml:AttributeValue>(.*?)</saml:AttributeValue>",
            Pattern.DOTALL);
    Matcher m = p.matcher(xml);
    while (m.find()) {
      attrs.put(m.group(1), unescape(m.group(2).trim()));
    }
    return attrs;
  }

  private String statusCode(String xml) {
    Matcher m = Pattern.compile("StatusCode[^>]*Value=\"([^\"]+)\"").matcher(xml);
    if (m.find()) {
      String value = m.group(1);
      int idx = value.lastIndexOf(':');
      return idx >= 0 ? value.substring(idx + 1) : value;
    }
    return "Unknown";
  }

  private String attr(String xml, String element, String name) {
    Pattern p =
        Pattern.compile(
            "<(?:\\w+:)?" + element + "\\b[^>]*\\b" + name + "=\"([^\"]+)\"", Pattern.DOTALL);
    Matcher m = p.matcher(xml);
    return m.find() ? m.group(1) : "";
  }

  private String tagText(String xml, String localName) {
    Pattern p =
        Pattern.compile(
            "<(?:\\w+:)?" + localName + "\\b[^>]*>(.*?)</(?:\\w+:)?" + localName + ">",
            Pattern.DOTALL);
    Matcher m = p.matcher(xml);
    return m.find() ? unescape(m.group(1).trim()) : "";
  }

  private static String unescape(String value) {
    return value
        .replace("&quot;", "\"")
        .replace("&gt;", ">")
        .replace("&lt;", "<")
        .replace("&amp;", "&");
  }
}
