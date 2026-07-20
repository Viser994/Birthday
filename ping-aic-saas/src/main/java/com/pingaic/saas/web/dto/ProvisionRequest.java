package com.pingaic.saas.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ProvisionRequest {
  @NotBlank
  private String username;
  @NotBlank @Email
  private String email;
  @NotBlank
  private String givenName;
  @NotBlank
  private String surname;
  private boolean passwordlessEnabled = true;

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getGivenName() { return givenName; }
  public void setGivenName(String givenName) { this.givenName = givenName; }
  public String getSurname() { return surname; }
  public void setSurname(String surname) { this.surname = surname; }
  public boolean isPasswordlessEnabled() { return passwordlessEnabled; }
  public void setPasswordlessEnabled(boolean passwordlessEnabled) {
    this.passwordlessEnabled = passwordlessEnabled;
  }
}
