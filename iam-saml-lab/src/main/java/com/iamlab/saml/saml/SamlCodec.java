package com.iamlab.saml.saml;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;
import org.springframework.stereotype.Component;

/**
 * Encodes/decodes SAML messages for Redirect (deflate + base64) and POST (base64) bindings.
 */
@Component
public class SamlCodec {

  /** HTTP-Redirect binding: DEFLATE then Base64 (URL-safe encoding done by callers). */
  public String encodeRedirect(String xml) {
    try {
      ByteArrayOutputStream bytes = new ByteArrayOutputStream();
      try (DeflaterOutputStream deflater =
          new DeflaterOutputStream(bytes, new Deflater(Deflater.DEFLATED, true))) {
        deflater.write(xml.getBytes(StandardCharsets.UTF_8));
      }
      return Base64.getEncoder().encodeToString(bytes.toByteArray());
    } catch (Exception e) {
      throw new IllegalStateException("Failed to encode SAML Redirect binding payload", e);
    }
  }

  public String decodeRedirect(String encoded) {
    try {
      byte[] decoded = Base64.getDecoder().decode(encoded.replace(" ", "+"));
      ByteArrayInputStream in = new ByteArrayInputStream(decoded);
      try (InflaterInputStream inflater = new InflaterInputStream(in, new Inflater(true));
          ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        inflater.transferTo(out);
        return out.toString(StandardCharsets.UTF_8);
      }
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid SAMLRequest (Redirect binding)", e);
    }
  }

  /** HTTP-POST binding: Base64 only (no deflate). */
  public String encodePost(String xml) {
    return Base64.getEncoder().encodeToString(xml.getBytes(StandardCharsets.UTF_8));
  }

  public String decodePost(String encoded) {
    try {
      byte[] decoded = Base64.getDecoder().decode(encoded.replace(" ", "+"));
      return new String(decoded, StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid SAMLResponse (POST binding)", e);
    }
  }

  public String prettyXml(String xml) {
    if (xml == null || xml.isBlank()) {
      return "";
    }
    String compact = xml.replaceAll(">\\s+<", "><").trim();
    StringBuilder out = new StringBuilder();
    int depth = 0;
    int i = 0;
    while (i < compact.length()) {
      if (compact.startsWith("</", i)) {
        depth = Math.max(0, depth - 1);
        int end = compact.indexOf('>', i);
        out.append("  ".repeat(depth)).append(compact, i, end + 1).append('\n');
        i = end + 1;
      } else if (compact.startsWith("<?", i)) {
        int end = compact.indexOf("?>", i);
        out.append(compact, i, end + 2).append('\n');
        i = end + 2;
      } else if (compact.startsWith("<", i)) {
        int end = compact.indexOf('>', i);
        String tag = compact.substring(i, end + 1);
        out.append("  ".repeat(depth)).append(tag).append('\n');
        if (!tag.endsWith("/>") && !tag.startsWith("<?") && !tag.startsWith("<!")) {
          depth++;
        }
        // self-closing already handled; closing tags handled above
        if (tag.endsWith("/>")) {
          // no depth change already applied
        }
        i = end + 1;
        // if next is text content before next tag
        if (i < compact.length() && compact.charAt(i) != '<') {
          int next = compact.indexOf('<', i);
          String text = compact.substring(i, next).trim();
          if (!text.isEmpty()) {
            out.append("  ".repeat(depth)).append(text).append('\n');
          }
          i = next;
        }
      } else {
        i++;
      }
    }
    return out.toString().trim();
  }
}
