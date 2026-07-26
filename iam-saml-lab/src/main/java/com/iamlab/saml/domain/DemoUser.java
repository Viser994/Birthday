package com.iamlab.saml.domain;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DemoUser {
  private final String username;
  private final String password;
  private final String email;
  private final String displayName;
  private final List<String> groups;
  private final String department;

  public DemoUser(
      String username,
      String password,
      String email,
      String displayName,
      List<String> groups,
      String department) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.displayName = displayName;
    this.groups = groups;
    this.department = department;
  }

  public String getUsername() {
    return username;
  }

  public String getPassword() {
    return password;
  }

  public String getEmail() {
    return email;
  }

  public String getDisplayName() {
    return displayName;
  }

  public List<String> getGroups() {
    return groups;
  }

  public String getDepartment() {
    return department;
  }

  public Map<String, String> samlAttributes() {
    Map<String, String> attrs = new LinkedHashMap<>();
    attrs.put("email", email);
    attrs.put("displayName", displayName);
    attrs.put("department", department);
    attrs.put("groups", String.join(",", groups));
    return attrs;
  }
}
