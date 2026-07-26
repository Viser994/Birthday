package com.iamlab.saml.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "iamlab")
public class IamLabProperties {
  private String appName = "IAM SAML Lab";
  private String baseUrl = "http://localhost:9200";
  private Sp sp = new Sp();
  private Idp idp = new Idp();
  private Demo demo = new Demo();

  public String getAppName() {
    return appName;
  }

  public void setAppName(String appName) {
    this.appName = appName;
  }

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public Sp getSp() {
    return sp;
  }

  public void setSp(Sp sp) {
    this.sp = sp;
  }

  public Idp getIdp() {
    return idp;
  }

  public void setIdp(Idp idp) {
    this.idp = idp;
  }

  public Demo getDemo() {
    return demo;
  }

  public void setDemo(Demo demo) {
    this.demo = demo;
  }

  public static class Sp {
    private String entityId = "https://sp.iamlab.local/metadata";
    private String acsUrl = "http://localhost:9200/sp/acs";
    private String sessionCookie = "IAMLAB_SP_SESSION";

    public String getEntityId() {
      return entityId;
    }

    public void setEntityId(String entityId) {
      this.entityId = entityId;
    }

    public String getAcsUrl() {
      return acsUrl;
    }

    public void setAcsUrl(String acsUrl) {
      this.acsUrl = acsUrl;
    }

    public String getSessionCookie() {
      return sessionCookie;
    }

    public void setSessionCookie(String sessionCookie) {
      this.sessionCookie = sessionCookie;
    }
  }

  public static class Idp {
    private String entityId = "https://idp.iamlab.local/metadata";
    private String ssoUrl = "http://localhost:9200/idp/sso";
    private String sessionCookie = "IAMLAB_IDP_SESSION";

    public String getEntityId() {
      return entityId;
    }

    public void setEntityId(String entityId) {
      this.entityId = entityId;
    }

    public String getSsoUrl() {
      return ssoUrl;
    }

    public void setSsoUrl(String ssoUrl) {
      this.ssoUrl = ssoUrl;
    }

    public String getSessionCookie() {
      return sessionCookie;
    }

    public void setSessionCookie(String sessionCookie) {
      this.sessionCookie = sessionCookie;
    }
  }

  public static class Demo {
    private String hint = "Use alice / password or bob / password at the IdP login";

    public String getHint() {
      return hint;
    }

    public void setHint(String hint) {
      this.hint = hint;
    }
  }
}
