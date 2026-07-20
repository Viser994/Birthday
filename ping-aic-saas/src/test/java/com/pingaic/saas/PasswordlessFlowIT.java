package com.pingaic.saas;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PasswordlessFlowIT {

  @Autowired TestRestTemplate rest;

  @Test
  void registerAndLoginPasswordless() {
    Map<String, Object> startBody =
        Map.of(
            "username", "casey.nguyen",
            "email", "casey.nguyen@example.com",
            "givenName", "Casey",
            "surname", "Nguyen");

    ResponseEntity<Map> start =
        rest.postForEntity("/api/register/start", startBody, Map.class);
    assertThat(start.getStatusCode()).isEqualTo(HttpStatus.OK);
    String challengeId = String.valueOf(start.getBody().get("challengeId"));
    String otp = String.valueOf(start.getBody().get("demoOtp"));

    ResponseEntity<Map> verify =
        rest.postForEntity(
            "/api/register/verify",
            Map.of("challengeId", challengeId, "otpCode", otp),
            Map.class);
    assertThat(verify.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(verify.getBody().get("step")).isEqualTo("REGISTER_COMPLETE");

    ResponseEntity<Map> loginStart =
        rest.postForEntity(
            "/api/login/start", Map.of("email", "casey.nguyen@example.com"), Map.class);
    assertThat(loginStart.getStatusCode()).isEqualTo(HttpStatus.OK);
    String loginChallenge = String.valueOf(loginStart.getBody().get("challengeId"));
    String loginOtp = String.valueOf(loginStart.getBody().get("demoOtp"));

    ResponseEntity<Map> loginVerify =
        rest.postForEntity(
            "/api/login/verify",
            Map.of("challengeId", loginChallenge, "otpCode", loginOtp),
            Map.class);
    assertThat(loginVerify.getStatusCode()).isEqualTo(HttpStatus.OK);
    String tokenId = String.valueOf(loginVerify.getBody().get("tokenId"));

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(tokenId);
    ResponseEntity<Map> me =
        rest.exchange(
            "/api/session/me",
            org.springframework.http.HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class);
    assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(me.getBody().get("authenticated")).isEqualTo(true);
    assertThat(me.getBody().get("email")).isEqualTo("casey.nguyen@example.com");
  }
}
