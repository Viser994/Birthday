package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import com.pingaic.saas.domain.AuthChallenge;
import com.pingaic.saas.domain.SessionToken;
import com.pingaic.saas.domain.UserAccount;
import com.pingaic.saas.store.InMemoryIdentityStore;
import com.pingaic.saas.web.dto.LoginStartRequest;
import com.pingaic.saas.web.dto.VerifyOtpRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Step 4 — Passwordless authentication: prove identity with email OTP / magic link
 * instead of a password. In Ping AIC this is typically a Login journey with
 * Email Suspend / OTP / WebAuthn nodes (no Platform Password node).
 */
@Service
public class PasswordlessAuthService {
  private final InMemoryIdentityStore store;
  private final PingAicProperties properties;
  private final AicJourneyClient journeyClient;
  private final AuditLog auditLog;

  public PasswordlessAuthService(
      InMemoryIdentityStore store,
      PingAicProperties properties,
      AicJourneyClient journeyClient,
      AuditLog auditLog) {
    this.store = store;
    this.properties = properties;
    this.journeyClient = journeyClient;
    this.auditLog = auditLog;
  }

  public Map<String, Object> startLogin(LoginStartRequest request) {
    UserAccount user =
        store
            .findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No identity found for that email — provision or register first"));

    if (!user.isActive() || !user.isPasswordlessEnabled()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Passwordless login disabled for this user");
    }

    String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    String magic = UUID.randomUUID().toString().replace("-", "");
    String challengeId = UUID.randomUUID().toString();
    String authId = "local-" + UUID.randomUUID();

    Map<String, Object> aicCallbacks = Map.of();
    if (properties.isAicMode()) {
      aicCallbacks = journeyClient.startJourney(properties.getJourneys().getLogin());
      Object remoteAuthId = aicCallbacks.get("authId");
      if (remoteAuthId != null) {
        authId = String.valueOf(remoteAuthId);
      }
    }

    AuthChallenge challenge =
        new AuthChallenge(
            challengeId,
            user.getUsername(),
            user.getEmail(),
            "LOGIN",
            otp,
            magic,
            Instant.now().plusSeconds(properties.getLab().getOtpTtlSeconds()),
            authId);
    store.saveChallenge(challenge);

    String magicLink =
        properties.getLab().getMagicLinkBaseUrl()
            + "/api/passwordless/magic?token="
            + magic;

    auditLog.record("LOGIN_START", user.getUsername(), "Passwordless login challenge issued");

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("step", "LOGIN_START");
    response.put("lesson", "Passwordless auth challenges a registered factor — never a shared secret password.");
    response.put("pingAicConcept", "AIC Login journey callbacks (authId + NameCallback/OTP) until tokenId");
    response.put("challengeId", challengeId);
    response.put("authId", authId);
    response.put("email", user.getEmail());
    response.put("expiresAt", challenge.getExpiresAt().toString());
    response.put("demoOtp", otp);
    response.put("magicLink", magicLink);
    response.put("callbacks", aicCallbacks);
    response.put("nextStep", "Submit OTP or open magic link to receive a session token.");
    return response;
  }

  public Map<String, Object> verifyLogin(VerifyOtpRequest request) {
    AuthChallenge challenge =
        store
            .findChallenge(request.getChallengeId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown challenge"));

    if (!"LOGIN".equals(challenge.getPurpose())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Challenge is not a login challenge");
    }
    if (challenge.isConsumed() || challenge.isExpired()) {
      throw new ResponseStatusException(HttpStatus.GONE, "Challenge expired or already used");
    }
    if (!challenge.getOtpCode().equals(request.getOtpCode().trim())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP");
    }

    return completeLogin(challenge, "OTP");
  }

  public Map<String, Object> completeMagicLink(String token) {
    AuthChallenge challenge =
        store
            .findChallengeByMagic(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid magic link"));

    if (challenge.isConsumed() || challenge.isExpired()) {
      throw new ResponseStatusException(HttpStatus.GONE, "Magic link expired or already used");
    }

    String purpose = challenge.getPurpose();
    if ("REGISTER".equals(purpose)) {
      // Auto-complete registration via magic link
      VerifyOtpRequest verify = new VerifyOtpRequest();
      verify.setChallengeId(challenge.getChallengeId());
      verify.setOtpCode(challenge.getOtpCode());
      verify.setAuthId(challenge.getAuthId());
      // Use registration service path through store only — duplicate minimal create
      if (store.findByEmail(challenge.getEmail()).isEmpty()) {
        String[] names = PendingRegistrationHolder.take(challenge.getChallengeId());
        UserAccount user =
            new UserAccount(challenge.getUsername(), challenge.getEmail(), names[0], names[1]);
        user.setProvisionSource("SELF_REGISTER");
        store.save(user);
      }
      challenge.setConsumed(true);
      // issue login session after register
      AuthChallenge loginLike =
          new AuthChallenge(
              UUID.randomUUID().toString(),
              challenge.getUsername(),
              challenge.getEmail(),
              "LOGIN",
              "000000",
              UUID.randomUUID().toString(),
              Instant.now().plusSeconds(60),
              challenge.getAuthId());
      return completeLogin(loginLike, "MAGIC_LINK_AFTER_REGISTER");
    }

    return completeLogin(challenge, "MAGIC_LINK");
  }

  private Map<String, Object> completeLogin(AuthChallenge challenge, String method) {
    UserAccount user =
        store
            .findByUsername(challenge.getUsername())
            .or(() -> store.findByEmail(challenge.getEmail()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User missing"));

    challenge.setConsumed(true);
    user.setLastLoginAt(Instant.now());
    store.save(user);

    SessionToken session =
        new SessionToken(
            UUID.randomUUID().toString(),
            user.getUsername(),
            user.getEmail(),
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of(
                "amr", method,
                "passwordless", true,
                "realm", properties.getRealm(),
                "mode", properties.getMode()));
    store.saveSession(session);

    auditLog.record("LOGIN_SUCCESS", user.getUsername(), "Authenticated via " + method);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("step", "LOGIN_SUCCESS");
    response.put("lesson", "Successful passwordless auth returns a session token — same outcome as AIC tokenId.");
    response.put("pingAicConcept", "Journey success payload contains tokenId (+ session cookie in browsers)");
    response.put("tokenId", session.getTokenId());
    response.put("method", method);
    response.put(
        "user",
        Map.of(
            "username", user.getUsername(),
            "email", user.getEmail(),
            "givenName", user.getGivenName(),
            "surname", user.getSurname()));
    response.put("expiresAt", session.getExpiresAt().toString());
    response.put("claims", session.getClaims());
    response.put("nextStep", "Call /api/session/me with Authorization: Bearer <tokenId>.");
    return response;
  }

  public Map<String, Object> me(String bearerToken) {
    if (bearerToken == null || bearerToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
    }
    String token = bearerToken.replaceFirst("(?i)^Bearer\\s+", "").trim();
    SessionToken session =
        store
            .findSession(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session"));
    if (session.isExpired()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
    }
    UserAccount user =
        store
            .findByUsername(session.getUsername())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("authenticated", true);
    response.put("username", user.getUsername());
    response.put("email", user.getEmail());
    response.put("givenName", user.getGivenName());
    response.put("surname", user.getSurname());
    response.put("factors", user.getFactors());
    response.put("claims", session.getClaims());
    response.put("expiresAt", session.getExpiresAt().toString());
    return response;
  }
}
