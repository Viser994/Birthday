package com.pingaic.saas.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AuditLog {
  public record Entry(String at, String action, String principal, String detail) {}

  private final List<Entry> entries = new ArrayList<>();

  public synchronized void record(String action, String principal, String detail) {
    entries.add(0, new Entry(Instant.now().toString(), action, principal, detail));
    if (entries.size() > 100) {
      entries.remove(entries.size() - 1);
    }
  }

  public synchronized List<Entry> recent() {
    return List.copyOf(entries);
  }

  public synchronized List<Map<String, String>> recentAsMaps() {
    return entries.stream()
        .map(
            e ->
                Map.of(
                    "at", e.at(),
                    "action", e.action(),
                    "principal", e.principal(),
                    "detail", e.detail()))
        .toList();
  }
}
