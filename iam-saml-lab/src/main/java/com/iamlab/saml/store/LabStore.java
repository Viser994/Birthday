package com.iamlab.saml.store;

import com.iamlab.saml.domain.DemoUser;
import com.iamlab.saml.domain.FlowTrace;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class LabStore {
  private final Map<String, DemoUser> users = new LinkedHashMap<>();
  private final Map<String, FlowTrace> flows = new ConcurrentHashMap<>();
  private final Map<String, SpSession> spSessions = new ConcurrentHashMap<>();
  private final Map<String, String> idpSessions = new ConcurrentHashMap<>();
  private final Map<String, PendingAuthn> pendingByRequestId = new ConcurrentHashMap<>();

  public LabStore() {
    users.put(
        "alice",
        new DemoUser(
            "alice",
            "password",
            "alice@example.com",
            "Alice Anderson",
            List.of("employees", "finance"),
            "Finance"));
    users.put(
        "bob",
        new DemoUser(
            "bob",
            "password",
            "bob@example.com",
            "Bob Baker",
            List.of("employees", "engineering"),
            "Engineering"));
  }

  public Optional<DemoUser> authenticate(String username, String password) {
    DemoUser user = users.get(username == null ? "" : username.toLowerCase());
    if (user != null && user.getPassword().equals(password)) {
      return Optional.of(user);
    }
    return Optional.empty();
  }

  public Optional<DemoUser> findUser(String username) {
    return Optional.ofNullable(users.get(username == null ? "" : username.toLowerCase()));
  }

  public List<Map<String, Object>> listUsersPublic() {
    return users.values().stream()
        .map(
            u -> {
              Map<String, Object> m = new LinkedHashMap<>();
              m.put("username", u.getUsername());
              m.put("email", u.getEmail());
              m.put("displayName", u.getDisplayName());
              m.put("department", u.getDepartment());
              m.put("groups", u.getGroups());
              m.put("passwordHint", "password");
              return m;
            })
        .toList();
  }

  public FlowTrace newFlow() {
    FlowTrace flow = new FlowTrace();
    flows.put(flow.getFlowId(), flow);
    return flow;
  }

  public Optional<FlowTrace> findFlow(String flowId) {
    return Optional.ofNullable(flows.get(flowId));
  }

  public FlowTrace latestFlow() {
    return flows.values().stream()
        .reduce((a, b) -> a.getStartedAt().isAfter(b.getStartedAt()) ? a : b)
        .orElse(null);
  }

  public void savePending(PendingAuthn pending) {
    pendingByRequestId.put(pending.requestId(), pending);
  }

  public Optional<PendingAuthn> findPending(String requestId) {
    return Optional.ofNullable(pendingByRequestId.get(requestId));
  }

  public String createIdpSession(String username) {
    String token = UUID.randomUUID().toString();
    idpSessions.put(token, username);
    return token;
  }

  public Optional<String> findIdpUsername(String token) {
    return Optional.ofNullable(idpSessions.get(token));
  }

  public void clearIdpSession(String token) {
    if (token != null) {
      idpSessions.remove(token);
    }
  }

  public SpSession createSpSession(String nameId, Map<String, String> attributes, String flowId) {
    SpSession session =
        new SpSession(UUID.randomUUID().toString(), nameId, attributes, flowId, Instant.now());
    spSessions.put(session.token(), session);
    return session;
  }

  public Optional<SpSession> findSpSession(String token) {
    return Optional.ofNullable(spSessions.get(token));
  }

  public void clearSpSession(String token) {
    if (token != null) {
      spSessions.remove(token);
    }
  }

  public record PendingAuthn(
      String requestId,
      String flowId,
      String relayState,
      String authnRequestXml,
      Instant createdAt) {}

  public record SpSession(
      String token,
      String nameId,
      Map<String, String> attributes,
      String flowId,
      Instant createdAt) {
    public Map<String, Object> toView() {
      Map<String, Object> view = new LinkedHashMap<>();
      view.put("token", token);
      view.put("nameId", nameId);
      view.put("attributes", attributes);
      view.put("flowId", flowId);
      view.put("createdAt", createdAt.toString());
      return view;
    }
  }
}
