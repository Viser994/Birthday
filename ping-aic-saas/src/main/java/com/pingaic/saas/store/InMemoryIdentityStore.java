package com.pingaic.saas.store;

import com.pingaic.saas.domain.AuthChallenge;
import com.pingaic.saas.domain.SessionToken;
import com.pingaic.saas.domain.UserAccount;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryIdentityStore {
  private final Map<String, UserAccount> byUsername = new ConcurrentHashMap<>();
  private final Map<String, UserAccount> byEmail = new ConcurrentHashMap<>();
  private final Map<String, AuthChallenge> challenges = new ConcurrentHashMap<>();
  private final Map<String, AuthChallenge> challengesByMagic = new ConcurrentHashMap<>();
  private final Map<String, SessionToken> sessions = new ConcurrentHashMap<>();

  public synchronized UserAccount save(UserAccount user) {
    byUsername.put(user.getUsername().toLowerCase(), user);
    byEmail.put(user.getEmail().toLowerCase(), user);
    return user;
  }

  public Optional<UserAccount> findByUsername(String username) {
    return Optional.ofNullable(byUsername.get(username.toLowerCase()));
  }

  public Optional<UserAccount> findByEmail(String email) {
    return Optional.ofNullable(byEmail.get(email.toLowerCase()));
  }

  public boolean existsUsernameOrEmail(String username, String email) {
    return byUsername.containsKey(username.toLowerCase())
        || byEmail.containsKey(email.toLowerCase());
  }

  public Collection<UserAccount> listUsers() {
    return byUsername.values();
  }

  public void saveChallenge(AuthChallenge challenge) {
    challenges.put(challenge.getChallengeId(), challenge);
    challengesByMagic.put(challenge.getMagicToken(), challenge);
  }

  public Optional<AuthChallenge> findChallenge(String challengeId) {
    return Optional.ofNullable(challenges.get(challengeId));
  }

  public Optional<AuthChallenge> findChallengeByMagic(String magicToken) {
    return Optional.ofNullable(challengesByMagic.get(magicToken));
  }

  public void saveSession(SessionToken token) {
    sessions.put(token.getTokenId(), token);
  }

  public Optional<SessionToken> findSession(String tokenId) {
    return Optional.ofNullable(sessions.get(tokenId));
  }

  public void clearAll() {
    byUsername.clear();
    byEmail.clear();
    challenges.clear();
    challengesByMagic.clear();
    sessions.clear();
  }
}
