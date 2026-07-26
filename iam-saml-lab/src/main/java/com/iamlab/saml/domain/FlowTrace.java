package com.iamlab.saml.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Captures each step of a SAML SSO run so the UI can explain the flow. */
public class FlowTrace {
  public record Step(String id, String actor, String title, String detail, Instant at, Map<String, Object> data) {}

  private final String flowId = UUID.randomUUID().toString();
  private final Instant startedAt = Instant.now();
  private final List<Step> steps = new ArrayList<>();
  private String status = "STARTED";
  private String subject;
  private String relayState;

  public String getFlowId() {
    return flowId;
  }

  public Instant getStartedAt() {
    return startedAt;
  }

  public List<Step> getSteps() {
    return steps;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getRelayState() {
    return relayState;
  }

  public void setRelayState(String relayState) {
    this.relayState = relayState;
  }

  public void addStep(String actor, String title, String detail, Map<String, Object> data) {
    steps.add(
        new Step(
            "step-" + (steps.size() + 1),
            actor,
            title,
            detail,
            Instant.now(),
            data == null ? Map.of() : new LinkedHashMap<>(data)));
  }

  public Map<String, Object> toView() {
    Map<String, Object> view = new LinkedHashMap<>();
    view.put("flowId", flowId);
    view.put("startedAt", startedAt.toString());
    view.put("status", status);
    view.put("subject", subject);
    view.put("relayState", relayState);
    view.put("steps", steps);
    return view;
  }
}
