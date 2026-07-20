package com.pingaic.saas.domain;

import java.time.Instant;

public class AuthChallenge {
  private final String challengeId;
  private final String username;
  private final String email;
  private final String purpose; // REGISTER | LOGIN
  private final String otpCode;
  private final String magicToken;
  private final Instant expiresAt;
  private boolean consumed;
  private String authId; // mirrors AIC journey authId concept

  public AuthChallenge(
      String challengeId,
      String username,
      String email,
      String purpose,
      String otpCode,
      String magicToken,
      Instant expiresAt,
      String authId) {
    this.challengeId = challengeId;
    this.username = username;
    this.email = email;
    this.purpose = purpose;
    this.otpCode = otpCode;
    this.magicToken = magicToken;
    this.expiresAt = expiresAt;
    this.authId = authId;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public String getChallengeId() { return challengeId; }
  public String getUsername() { return username; }
  public String getEmail() { return email; }
  public String getPurpose() { return purpose; }
  public String getOtpCode() { return otpCode; }
  public String getMagicToken() { return magicToken; }
  public Instant getExpiresAt() { return expiresAt; }
  public boolean isConsumed() { return consumed; }
  public void setConsumed(boolean consumed) { this.consumed = consumed; }
  public String getAuthId() { return authId; }
  public void setAuthId(String authId) { this.authId = authId; }
}
