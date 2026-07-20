package com.pingaic.saas.domain;

import java.time.Instant;
import java.util.Map;

public class SessionToken {
  private final String tokenId;
  private final String username;
  private final String email;
  private final Instant issuedAt;
  private final Instant expiresAt;
  private final Map<String, Object> claims;

  public SessionToken(
      String tokenId,
      String username,
      String email,
      Instant issuedAt,
      Instant expiresAt,
      Map<String, Object> claims) {
    this.tokenId = tokenId;
    this.username = username;
    this.email = email;
    this.issuedAt = issuedAt;
    this.expiresAt = expiresAt;
    this.claims = claims;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public String getTokenId() { return tokenId; }
  public String getUsername() { return username; }
  public String getEmail() { return email; }
  public Instant getIssuedAt() { return issuedAt; }
  public Instant getExpiresAt() { return expiresAt; }
  public Map<String, Object> getClaims() { return claims; }
}
