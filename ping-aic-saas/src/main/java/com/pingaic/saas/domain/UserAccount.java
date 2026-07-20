package com.pingaic.saas.domain;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

public class UserAccount {
  private final String id;
  private String username;
  private String email;
  private String givenName;
  private String surname;
  private boolean active = true;
  private boolean passwordlessEnabled = true;
  private String provisionSource = "SELF_REGISTER"; // ADMIN_PROVISION | SELF_REGISTER | AIC_SYNC
  private Instant createdAt = Instant.now();
  private Instant lastLoginAt;
  private final Set<String> factors = new LinkedHashSet<>();

  public UserAccount(String username, String email, String givenName, String surname) {
    this.id = UUID.randomUUID().toString();
    this.username = username;
    this.email = email;
    this.givenName = givenName;
    this.surname = surname;
    this.factors.add("EMAIL_OTP");
    this.factors.add("MAGIC_LINK");
  }

  public String getId() { return id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getGivenName() { return givenName; }
  public void setGivenName(String givenName) { this.givenName = givenName; }
  public String getSurname() { return surname; }
  public void setSurname(String surname) { this.surname = surname; }
  public boolean isActive() { return active; }
  public void setActive(boolean active) { this.active = active; }
  public boolean isPasswordlessEnabled() { return passwordlessEnabled; }
  public void setPasswordlessEnabled(boolean passwordlessEnabled) { this.passwordlessEnabled = passwordlessEnabled; }
  public String getProvisionSource() { return provisionSource; }
  public void setProvisionSource(String provisionSource) { this.provisionSource = provisionSource; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getLastLoginAt() { return lastLoginAt; }
  public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
  public Set<String> getFactors() { return factors; }
}
