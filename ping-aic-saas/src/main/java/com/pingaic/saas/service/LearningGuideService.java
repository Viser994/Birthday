package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class LearningGuideService {
  private final PingAicProperties properties;
  private final AuditLog auditLog;

  public LearningGuideService(PingAicProperties properties, AuditLog auditLog) {
    this.properties = properties;
    this.auditLog = auditLog;
  }

  public Map<String, Object> overview() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("app", properties.getLab().getAppName());
    body.put("mode", properties.getMode());
    body.put("aicEnabled", properties.isAicMode());
    body.put(
        "goal",
        "Learn SaaS IAM with PingOne Advanced Identity Cloud by building passwordless provision, register, and authenticate flows.");
    body.put(
        "steps",
        List.of(
            step(
                1,
                "Understand SaaS IAM",
                "AIC hosts identity (IDM) + access (AM) journeys in the cloud. Your app calls REST APIs; AIC stores users and runs auth journeys.",
                "Read /api/guide and the README Step 1."),
            step(
                2,
                "Provision",
                "Admin/HR creates an identity before first login (or sync from HR). In AIC: create managed/alpha_user.",
                "POST /api/provision"),
            step(
                3,
                "Register (passwordless)",
                "User proves email ownership via OTP/magic link. No password is stored. In AIC: Registration journey without Platform Password node.",
                "POST /api/register/start → POST /api/register/verify"),
            step(
                4,
                "Authenticate (passwordless)",
                "User signs in with email OTP or magic link (later: WebAuthn/passkeys). In AIC: Login journey returning tokenId.",
                "POST /api/login/start → POST /api/login/verify"),
            step(
                5,
                "Connect real AIC tenant",
                "Set pingaic.mode=AIC and tenant URL + journey names. Local lab still works; AIC callbacks are attempted in parallel.",
                "Update application.properties and restart")));
    body.put("docs", docs());
    body.put("recentAudit", auditLog.recentAsMaps());
    return body;
  }

  private static Map<String, Object> step(int n, String title, String concept, String action) {
    return Map.of("n", n, "title", title, "concept", concept, "action", action);
  }

  private static Map<String, String> docs() {
    Map<String, String> docs = new LinkedHashMap<>();
    docs.put(
        "AIC WebAuthn / passkeys",
        "https://docs.pingidentity.com/pingoneaic/am-authentication/authn-mfa-webauthn.html");
    docs.put(
        "AIC self-registration",
        "https://docs.pingidentity.com/pingoneaic/self-service/self-registration.html");
    docs.put(
        "AIC API docs",
        "https://developer.pingidentity.com/pingoneaic-api/_attachments/api/index.html");
    docs.put(
        "Journey authenticate pattern",
        "https://medium.com/@christian.brindley/testing-journeys-in-pingone-advanced-identity-cloud-7e7da92c1aaf");
    return docs;
  }
}
