package com.pingaic.saas.web.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyOtpRequest {
  @NotBlank
  private String challengeId;
  @NotBlank
  private String otpCode;
  /** AIC-style journey continuation token (optional in LOCAL mode). */
  private String authId;

  public String getChallengeId() { return challengeId; }
  public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
  public String getOtpCode() { return otpCode; }
  public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
  public String getAuthId() { return authId; }
  public void setAuthId(String authId) { this.authId = authId; }
}
