package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import com.pingaic.saas.domain.AuthChallenge;
import com.pingaic.saas.domain.UserAccount;
import com.pingaic.saas.store.InMemoryIdentityStore;
import com.pingaic.saas.web.dto.RegisterStartRequest;
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
 * Step 3 — Registration: end-user self-registration without a password.
 * Mirrors a Ping AIC Registration journey that collects attributes and
 * binds a passwordless factor (email OTP / magic link / later WebAuthn).
 */
@Service
public class RegistrationService {
  private final InMemoryIdentityStore store;
  private final PingAicProperties properties;
  private final AicJourneyClient journeyClient;
  private final AuditLog auditLog;

  public RegistrationService(
      InMemoryIdentityStore store,
      PingAicProperties properties,
      AicJourneyClient journeyClient,
      AuditLog auditLog) {
    this.store = store;
    this.properties = properties;
    this.journeyClient = journeyClient;
    this.auditLog = auditLog;
  }

  public Map<String, Object> start(RegisterStartRequest request) {
    if (store.existsUsernameOrEmail(request.getUsername(), request.getEmail())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists — try login instead");
    }

    String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    String magic = UUID.randomUUID().toString().replace("-", "");
    String challengeId = UUID.randomUUID().toString();
    String authId = "local-" + UUID.randomUUID();

    Map<String, Object> aicCallbacks = Map.of();
    if (properties.isAicMode()) {
      aicCallbacks = journeyClient.startJourney(properties.getJourneys().getRegistration());
      Object remoteAuthId = aicCallbacks.get("authId");
      if (remoteAuthId != null) {
        authId = String.valueOf(remoteAuthId);
      }
    }

    AuthChallenge challenge =
        new AuthChallenge(
            challengeId,
            request.getUsername().trim(),
            request.getEmail().trim().toLowerCase(),
            "REGISTER",
            otp,
            magic,
            Instant.now().plusSeconds(properties.getLab().getOtpTtlSeconds()),
            authId);
    // stash profile fields in authId metadata via challenge fields already present
    store.saveChallenge(challenge);
    // temporarily park profile on a lightweight pending user marker using challenge username+email
    PendingRegistrationHolder.put(
        challengeId,
        request.getGivenName().trim(),
        request.getSurname().trim());

    String magicLink =
        properties.getLab().getMagicLinkBaseUrl()
            + "/api/passwordless/magic?token="
            + magic;

    auditLog.record("REGISTER_START", request.getUsername(), "Passwordless registration challenge issued");

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("step", "REGISTER_START");
    response.put("lesson", "Registration journeys collect profile attributes, then prove possession of a factor.");
    response.put("pingAicConcept", "AIC Registration journey + Attribute Collector + Create Object (no Platform Password node)");
    response.put("challengeId", challengeId);
    response.put("authId", authId);
    response.put("email", challenge.getEmail());
    response.put("expiresAt", challenge.getExpiresAt().toString());
    response.put(
        "demoOtp",
        otp); // learning lab only — never return OTP in production
    response.put("magicLink", magicLink);
    response.put("callbacks", aicCallbacks);
    response.put("nextStep", "Verify the email OTP (or open the magic link) to create the account.");
    return response;
  }

  public Map<String, Object> verify(VerifyOtpRequest request) {
    AuthChallenge challenge =
        store
            .findChallenge(request.getChallengeId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown challenge"));

    if (!"REGISTER".equals(challenge.getPurpose())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Challenge is not a registration challenge");
    }
    if (challenge.isConsumed() || challenge.isExpired()) {
      throw new ResponseStatusException(HttpStatus.GONE, "Challenge expired or already used");
    }
    if (!challenge.getOtpCode().equals(request.getOtpCode().trim())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP");
    }

    if (properties.isAicMode() && request.getAuthId() != null && !request.getAuthId().isBlank()) {
      journeyClient.continueWithNameCallback(request.getAuthId(), challenge.getUsername());
    }

    String[] names = PendingRegistrationHolder.take(challenge.getChallengeId());
    UserAccount user =
        new UserAccount(challenge.getUsername(), challenge.getEmail(), names[0], names[1]);
    user.setProvisionSource("SELF_REGISTER");
    user.setPasswordlessEnabled(true);
    store.save(user);
    challenge.setConsumed(true);

    auditLog.record("REGISTER_COMPLETE", user.getUsername(), "Passwordless registration completed");

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("step", "REGISTER_COMPLETE");
    response.put("lesson", "After factor proof, Create Object persists the identity — without a password.");
    response.put("pingAicConcept", "Journey success → identity created in AIC IDM");
    response.put(
        "user",
        Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "givenName", user.getGivenName(),
            "surname", user.getSurname(),
            "factors", user.getFactors()));
    response.put("nextStep", "Use Login (passwordless) to authenticate with email OTP or magic link.");
    return response;
  }
}
