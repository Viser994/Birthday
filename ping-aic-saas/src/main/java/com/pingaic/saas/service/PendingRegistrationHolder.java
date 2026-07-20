package com.pingaic.saas.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Temporary holder for registration profile fields keyed by challenge. */
final class PendingRegistrationHolder {
  private static final Map<String, String[]> DATA = new ConcurrentHashMap<>();

  private PendingRegistrationHolder() {}

  static void put(String challengeId, String givenName, String surname) {
    DATA.put(challengeId, new String[] {givenName, surname});
  }

  static String[] take(String challengeId) {
    String[] names = DATA.remove(challengeId);
    return names == null ? new String[] {"Learner", "User"} : names;
  }
}
