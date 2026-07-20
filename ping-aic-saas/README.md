# Ping AIC SaaS

Java learning lab for **SaaS IAM** with **PingOne Advanced Identity Cloud (AIC)** concepts:

1. **Provisioning** — create identities  
2. **Registration** — passwordless self-registration  
3. **Authentication** — passwordless login (email OTP / magic link)

Runs fully in **LOCAL** mode (no Ping tenant required). Optionally connect a real AIC tenant.

---

## Step-by-step learning path

### Step 1 — Understand SaaS IAM (Ping AIC)

In a classic IAM stack you run your own directory + auth servers.  
With **PingOne Advanced Identity Cloud**:

| Piece | AIC role | Your app’s job |
| --- | --- | --- |
| Identity store | IDM (`managed/alpha_user`) | Provision / sync users |
| Authentication | AM **journeys** | Call `/authenticate`, complete **callbacks** |
| Session | `tokenId` / session cookie | Protect APIs with the session |

Passwordless in AIC usually means journeys **without** a Platform Password node — using Email OTP, magic link, or **WebAuthn/passkeys**.

Docs:
- [Self-registration](https://docs.pingidentity.com/pingoneaic/self-service/self-registration.html)
- [WebAuthn / passkeys](https://docs.pingidentity.com/pingoneaic/am-authentication/authn-mfa-webauthn.html)
- [AIC APIs](https://developer.pingidentity.com/pingoneaic-api/_attachments/api/index.html)

### Step 2 — Run this Java lab

```bash
cd ping-aic-saas
mvn spring-boot:run
```

Open: **http://localhost:8088**

### Step 3 — Provision (admin)

UI panel **Provision** or:

```bash
curl -s -X POST http://localhost:8088/api/provision \
  -H 'Content-Type: application/json' \
  -d '{
    "username":"alex.rivera",
    "email":"alex.rivera@example.com",
    "givenName":"Alex",
    "surname":"Rivera",
    "passwordlessEnabled":true
  }' | jq
```

**AIC mapping:** `POST /openidm/managed/alpha_user`

### Step 4 — Register (passwordless)

1. Start registration → receive `challengeId` + demo OTP + magic link  
2. Verify OTP → account created **without a password**

```bash
# start
curl -s -X POST http://localhost:8088/api/register/start \
  -H 'Content-Type: application/json' \
  -d '{
    "username":"jordan.lee",
    "email":"jordan.lee@example.com",
    "givenName":"Jordan",
    "surname":"Lee"
  }' | jq

# verify (paste challengeId + demoOtp from start response)
curl -s -X POST http://localhost:8088/api/register/verify \
  -H 'Content-Type: application/json' \
  -d '{"challengeId":"...","otpCode":"123456"}' | jq
```

**AIC mapping:** Registration journey → Attribute Collector → Create Object (no password node)

### Step 5 — Authenticate (passwordless)

```bash
curl -s -X POST http://localhost:8088/api/login/start \
  -H 'Content-Type: application/json' \
  -d '{"email":"jordan.lee@example.com"}' | jq

curl -s -X POST http://localhost:8088/api/login/verify \
  -H 'Content-Type: application/json' \
  -d '{"challengeId":"...","otpCode":"123456"}' | jq

curl -s http://localhost:8088/api/session/me \
  -H "Authorization: Bearer <tokenId>"
```

**AIC mapping:**

```http
POST /am/json/realms/root/realms/alpha/authenticate?authIndexType=service&authIndexValue=PasswordlessLogin
```

Replay `authId` + completed callbacks until the response contains `tokenId`.

### Step 6 — Connect a real AIC tenant (optional)

Edit `src/main/resources/application.properties`:

```properties
pingaic.mode=AIC
pingaic.tenant-base-url=https://openam-<your-tenant>.id.forgerock.io
pingaic.realm=alpha
pingaic.journeys.registration=PasswordlessRegistration
pingaic.journeys.login=PasswordlessLogin
```

In the AIC admin console:

1. Create a **Registration** journey (username/email/name collectors + Create Object, no password).  
2. Create a **Login** journey for email OTP or WebAuthn.  
3. Name them to match `pingaic.journeys.*`.  

This lab still completes LOCAL OTP; it also attempts AIC journey start and returns callback payloads for learning.

---

## Project layout

```text
ping-aic-saas/
  pom.xml
  src/main/java/com/pingaic/saas/
    service/          # provision, register, passwordless auth, AIC clients
    domain/           # UserAccount, AuthChallenge, SessionToken
    web/              # REST + UI controllers
  src/main/resources/
    templates/index.html
    static/css|js
    application.properties
```

## REST API map

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/guide` | Step-by-step learning guide JSON |
| POST | `/api/provision` | Admin provisioning |
| GET | `/api/users` | List identities |
| POST | `/api/register/start` | Start passwordless registration |
| POST | `/api/register/verify` | Complete registration with OTP |
| POST | `/api/login/start` | Start passwordless login |
| POST | `/api/login/verify` | Complete login with OTP |
| GET | `/api/passwordless/magic?token=` | Magic-link completion |
| GET | `/api/session/me` | Session introspection |
| GET | `/api/audit` | Recent IAM events |

## What you should learn next

1. Replace email OTP with **WebAuthn/passkeys** (AIC WebAuthn Registration + Authentication nodes).  
2. Add **OAuth2/OIDC** app integration (authorization code + PKCE) against AIC.  
3. Add **SCIM / IDM connector** provisioning from HR.  
4. Implement proper **JWS / service account** tokens for IDM writes.  

## Requirements

- Java 21+  
- Maven 3.8+  
