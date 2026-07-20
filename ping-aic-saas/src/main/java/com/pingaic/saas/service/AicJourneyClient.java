package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Thin client for PingOne AIC authentication journeys.
 *
 * <pre>
 * POST /am/json/realms/root/realms/{realm}/authenticate?authIndexType=service&authIndexValue={journey}
 * </pre>
 *
 * Responses either contain {@code callbacks} (continue journey) or {@code tokenId} (success).
 */
@Service
public class AicJourneyClient {
  private static final Logger log = LoggerFactory.getLogger(AicJourneyClient.class);

  private final PingAicProperties properties;
  private final WebClient.Builder webClientBuilder;

  public AicJourneyClient(PingAicProperties properties, WebClient.Builder webClientBuilder) {
    this.properties = properties;
    this.webClientBuilder = webClientBuilder;
  }

  public Map<String, Object> startJourney(String journeyName) {
    if (!properties.isAicMode()) {
      return Map.of(
          "mode", "LOCAL",
          "message", "AIC mode disabled — local passwordless lab is active",
          "journey", journeyName);
    }

    String url =
        trimSlash(properties.getTenantBaseUrl())
            + "/am/json/realms/root/realms/"
            + properties.getRealm()
            + "/authenticate?authIndexType=service&authIndexValue="
            + journeyName;

    try {
      Map<?, ?> body =
          webClientBuilder
              .build()
              .post()
              .uri(url)
              .header("Accept-API-Version", "resource=2.1, protocol=1.0")
              .header("Content-Type", "application/json")
              .retrieve()
              .bodyToMono(Map.class)
              .block();

      Map<String, Object> result = new LinkedHashMap<>();
      result.put("mode", "AIC");
      result.put("journey", journeyName);
      result.put("endpoint", url);
      if (body != null) {
        result.put("authId", body.get("authId"));
        result.put("callbacks", body.get("callbacks"));
        result.put("tokenId", body.get("tokenId"));
        result.put("raw", body);
      }
      return result;
    } catch (WebClientResponseException ex) {
      log.warn("AIC journey start failed: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
      return Map.of(
          "mode", "AIC",
          "journey", journeyName,
          "error", ex.getStatusCode().toString(),
          "body", ex.getResponseBodyAsString(),
          "hint",
              "Check tenant URL, realm, journey name, and CORS/network. Local passwordless still works.");
    } catch (Exception ex) {
      log.warn("AIC journey start error", ex);
      return Map.of(
          "mode", "AIC",
          "journey", journeyName,
          "error", ex.getMessage(),
          "hint", "Unable to reach AIC tenant. Continue with LOCAL OTP flow.");
    }
  }

  public Map<String, Object> continueWithNameCallback(String authId, String username) {
    if (!properties.isAicMode()) {
      return Map.of("mode", "LOCAL", "skipped", true);
    }

    String url =
        trimSlash(properties.getTenantBaseUrl())
            + "/am/json/realms/root/realms/"
            + properties.getRealm()
            + "/authenticate";

    Map<String, Object> payload =
        Map.of(
            "authId",
            authId,
            "callbacks",
            List.of(
                Map.of(
                    "type",
                    "NameCallback",
                    "output",
                    List.of(Map.of("name", "prompt", "value", "User Name")),
                    "input",
                    List.of(Map.of("name", "IDToken1", "value", username)))));

    try {
      Map<?, ?> body =
          webClientBuilder
              .build()
              .post()
              .uri(url)
              .header("Accept-API-Version", "resource=2.1, protocol=1.0")
              .header("Content-Type", "application/json")
              .bodyValue(payload)
              .retrieve()
              .bodyToMono(Map.class)
              .block();
      Map<String, Object> result = new LinkedHashMap<>();
      result.put("mode", "AIC");
      result.put("continued", true);
      result.put("raw", body);
      return result;
    } catch (Exception ex) {
      return Map.of("mode", "AIC", "continued", false, "error", ex.getMessage());
    }
  }

  private static String trimSlash(String value) {
    if (value == null) return "";
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
