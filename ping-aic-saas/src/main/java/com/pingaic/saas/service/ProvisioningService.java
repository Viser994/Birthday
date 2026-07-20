package com.pingaic.saas.service;

import com.pingaic.saas.config.PingAicProperties;
import com.pingaic.saas.domain.UserAccount;
import com.pingaic.saas.store.InMemoryIdentityStore;
import com.pingaic.saas.web.dto.ProvisionRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Step 2 — Provisioning: an administrator (or HR/IT system) creates the identity
 * in the identity store before first login. In Ping AIC this maps to IDM
 * {@code managed/alpha_user} create via REST.
 */
@Service
public class ProvisioningService {
  private final InMemoryIdentityStore store;
  private final PingAicProperties properties;
  private final AicIdmClient aicIdmClient;
  private final AuditLog auditLog;

  public ProvisioningService(
      InMemoryIdentityStore store,
      PingAicProperties properties,
      AicIdmClient aicIdmClient,
      AuditLog auditLog) {
    this.store = store;
    this.properties = properties;
    this.aicIdmClient = aicIdmClient;
    this.auditLog = auditLog;
  }

  public Map<String, Object> provision(ProvisionRequest request) {
    if (store.existsUsernameOrEmail(request.getUsername(), request.getEmail())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
    }

    UserAccount user =
        new UserAccount(
            request.getUsername().trim(),
            request.getEmail().trim().toLowerCase(),
            request.getGivenName().trim(),
            request.getSurname().trim());
    user.setProvisionSource("ADMIN_PROVISION");
    user.setPasswordlessEnabled(request.isPasswordlessEnabled());
    store.save(user);

    Map<String, Object> aicResult = Map.of();
    if (properties.isAicMode()) {
      aicResult = aicIdmClient.createUser(user);
      user.setProvisionSource("ADMIN_PROVISION+AIC_SYNC");
      store.save(user);
    }

    auditLog.record(
        "PROVISION",
        user.getUsername(),
        "Admin provisioned passwordless-ready identity");

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("step", "PROVISION");
    response.put("lesson", "Provisioning creates the identity record before authentication.");
    response.put("pingAicConcept", "IDM managed user create (managed/alpha_user)");
    response.put("user", toView(user));
    response.put("aicSync", aicResult);
    response.put("nextStep", "Ask the user to complete passwordless registration (email OTP / passkey).");
    return response;
  }

  public List<Map<String, Object>> listUsers() {
    return store.listUsers().stream().map(this::toView).toList();
  }

  private Map<String, Object> toView(UserAccount user) {
    Map<String, Object> view = new LinkedHashMap<>();
    view.put("id", user.getId());
    view.put("username", user.getUsername());
    view.put("email", user.getEmail());
    view.put("givenName", user.getGivenName());
    view.put("surname", user.getSurname());
    view.put("active", user.isActive());
    view.put("passwordlessEnabled", user.isPasswordlessEnabled());
    view.put("factors", user.getFactors());
    view.put("provisionSource", user.getProvisionSource());
    view.put("createdAt", user.getCreatedAt().toString());
    view.put("lastLoginAt", user.getLastLoginAt() == null ? null : user.getLastLoginAt().toString());
    return view;
  }
}
