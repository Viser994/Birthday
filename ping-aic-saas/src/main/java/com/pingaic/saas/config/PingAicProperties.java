package com.pingaic.saas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pingaic")
public class PingAicProperties {
  private String mode = "LOCAL";
  private String tenantBaseUrl = "";
  private String realm = "alpha";
  private String cookieName = "";
  private Journeys journeys = new Journeys();
  private Idm idm = new Idm();
  private Lab lab = new Lab();

  public boolean isAicMode() {
    return "AIC".equalsIgnoreCase(mode) && tenantBaseUrl != null && !tenantBaseUrl.isBlank();
  }

  public String getMode() { return mode; }
  public void setMode(String mode) { this.mode = mode; }
  public String getTenantBaseUrl() { return tenantBaseUrl; }
  public void setTenantBaseUrl(String tenantBaseUrl) { this.tenantBaseUrl = tenantBaseUrl; }
  public String getRealm() { return realm; }
  public void setRealm(String realm) { this.realm = realm; }
  public String getCookieName() { return cookieName; }
  public void setCookieName(String cookieName) { this.cookieName = cookieName; }
  public Journeys getJourneys() { return journeys; }
  public void setJourneys(Journeys journeys) { this.journeys = journeys; }
  public Idm getIdm() { return idm; }
  public void setIdm(Idm idm) { this.idm = idm; }
  public Lab getLab() { return lab; }
  public void setLab(Lab lab) { this.lab = lab; }

  public static class Journeys {
    private String registration = "PasswordlessRegistration";
    private String login = "PasswordlessLogin";
    public String getRegistration() { return registration; }
    public void setRegistration(String registration) { this.registration = registration; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
  }

  public static class Idm {
    private String clientId = "";
    private String clientSecret = "";
    private String scope = "fr:idm:*";
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
  }

  public static class Lab {
    private String appName = "Ping AIC SaaS";
    private int otpTtlSeconds = 300;
    private String magicLinkBaseUrl = "http://localhost:8088";
    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }
    public int getOtpTtlSeconds() { return otpTtlSeconds; }
    public void setOtpTtlSeconds(int otpTtlSeconds) { this.otpTtlSeconds = otpTtlSeconds; }
    public String getMagicLinkBaseUrl() { return magicLinkBaseUrl; }
    public void setMagicLinkBaseUrl(String magicLinkBaseUrl) { this.magicLinkBaseUrl = magicLinkBaseUrl; }
  }
}
