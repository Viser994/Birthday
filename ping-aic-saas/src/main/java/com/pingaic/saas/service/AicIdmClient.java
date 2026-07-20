package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import com.pingaic.saas.domain.UserAccount;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Optional IDM provisioning client for Ping AIC managed users.
 *
 * <pre>
 * POST /openidm/managed/{realm}_user
 * </pre>
 */
@Service
public class AicIdmClient {
  private static final Logger log = LoggerFactory.getLogger(AicIdmClient.class);

  private final PingAicProperties properties;
  private final WebClient.Builder webClientBuilder;

  public AicIdmClient(PingAicProperties properties, WebClient.Builder webClientBuilder) {
    this.properties = properties;
    this.webClientBuilder = webClientBuilder;
  }

  public Map<String, Object> createUser(UserAccount user) {
    if (!properties.isAicMode()) {
      return Map.of("mode", "LOCAL", "synced", false);
    }
    if (properties.getIdm().getClientId() == null || properties.getIdm().getClientId().isBlank()) {
      return Map.of(
          "mode",
          "AIC",
          "synced",
          false,
          "hint",
          "Set pingaic.idm.client-id/secret to enable managed user create");
    }

    // Learning stub: shows the intended payload. Real tenants need a service-account access token.
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("userName", user.getUsername());
    payload.put("mail", user.getEmail());
    payload.put("givenName", user.getGivenName());
    payload.put("sn", user.getSurname());
    payload.put("accountStatus", "active");

    String endpoint =
        trimSlash(properties.getTenantBaseUrl())
            + "/openidm/managed/"
            + properties.getRealm()
            + "_user?_action=create";

    log.info("AIC IDM provision intended for {} via {}", user.getUsername(), endpoint);
    return Map.of(
        "mode", "AIC",
        "synced", false,
        "endpoint", endpoint,
        "payload", payload,
        "hint",
            "Exchange client credentials for an access token, then POST this payload to IDM.");
  }

  private static String trimSlash(String value) {
    if (value == null) return "";
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
