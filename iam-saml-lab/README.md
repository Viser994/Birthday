# IAM SAML Learning Lab

Interactive **Java** workspace to learn **IAM** concepts through a full **SAML 2.0 Web Browser SSO** flow.

One Spring Boot app hosts:

1. **Service Provider (SP)** — Acme Learning App (`/sp/*`)
2. **Identity Provider (IdP)** — Campus IdP (`/idp/*`)
3. **Learning home** — concepts, live timeline, session inspector (`/`)

No external IdP or certificates required for the lab. Messages are real SAML-shaped XML with Redirect and POST bindings so you can read every step.

---

## Run

```bash
cd iam-saml-lab
mvn spring-boot:run
```

Open: **http://localhost:8100**

Demo users at the IdP:

| Username | Password | Email |
| --- | --- | --- |
| `alice` | `password` | alice@example.com |
| `bob` | `password` | bob@example.com |

---

## Learn by doing (recommended path)

1. Open the lab home and read **IAM & SAML concepts**.
2. Click **Begin interactive SSO** (`/sp/start`).
3. Inspect the **AuthnRequest XML** (Issuer, Destination, ACS URL).
4. Continue to the IdP, sign in as `alice` / `password`.
5. Inspect the **SAML Response + Assertion** (NameID, Audience, attributes).
6. POST to the SP ACS and open the protected app (`/sp/app`).
7. Return home — the **live timeline** shows every SP/IdP step.
8. Try **Logout SP only**, then start SSO again — the IdP may reuse its cookie (SSO).

---

## What you will understand

| Concept | Where you see it |
| --- | --- |
| Federation trust (SP ↔ IdP) | Entity IDs on home + login pages |
| AuthnRequest | `/sp/start` XML panel |
| HTTP-Redirect binding | Browser redirect with `SAMLRequest` query param |
| IdP authentication | `/idp/sso` login form |
| Assertion / attributes | IdP response page + SP session |
| HTTP-POST binding | Auto-style form POST to `/sp/acs` |
| RelayState | Deep link returned after login (`/sp/app`) |
| App session vs IdP session | Separate cookies; logout links on home |

---

## Project layout

```
iam-saml-lab/
  src/main/java/com/iamlab/saml/
    saml/          AuthnRequest + Response factories, codec, parser
    service/       SP / IdP SSO orchestration + learning guide
    store/         Demo users, flow timeline, sessions
    web/           Controllers for lab UI, SP, IdP, API
  src/main/resources/templates/   Interactive Thymeleaf pages
```

---

## API helpers

| Endpoint | Purpose |
| --- | --- |
| `GET /api/guide` | Concepts, steps, demo users |
| `GET /api/flow` | Latest (or `?flowId=`) SSO timeline |
| `GET /api/session` | Current SP/IdP session state |

---

## Important lab note

This is a **teaching simulator**, not a production SAML stack.

Production systems add:

- XML digital signatures / certificate trust
- Strict schema validation and clock skew checks
- Encryption of assertions (optional)
- Metadata exchange (`EntityDescriptor`)
- Libraries such as **OpenSAML** or **Spring Security SAML2**

The lab intentionally keeps XML readable so you can learn the protocol first.

---

## Next learning topics

After SAML, continue the IAM path with:

1. **OAuth 2.0 / OIDC** — modern app login and API access tokens  
2. **Provisioning (SCIM)** — creating identities before authentication  
3. **MFA / passwordless** — step-up and WebAuthn  
4. **Authorization** — RBAC / ABAC after identity is established  
