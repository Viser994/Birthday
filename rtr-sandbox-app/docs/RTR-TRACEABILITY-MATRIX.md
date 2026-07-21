# RTR Traceability Matrix  
## Mapping this solution to Payments Canada guidelines

**Document ID:** `RTR-TRC-001`  
**Version:** `1.0`  
**Date:** `2026-07-20`  
**Audience:** Product, Architecture, Development, QA, Compliance  
**Scope:** Payments Canada Real-Time Rail (RTR) **sandbox** integration via REST APIs  

This document provides bidirectional traceability between:
1. Payments Canada published guidelines / sandbox capabilities  
2. ISO 20022 RTR message specifications  
3. Sandbox REST endpoints  
4. This repository’s API contract and implementation  
5. Verification evidence  

---

## 1. Source of truth references (Payments Canada)

| Ref ID | Source | URL / location | How it is used |
| --- | --- | --- | --- |
| `PC-RTR-PORTAL` | RTR Sandbox API (Developer Portal) | https://developer.payments.ca/rtr-sandbox-api/apis | Primary sandbox API capability list and message flows |
| `PC-RTR-TECH` | Technology and innovation (RTR) | https://www.payments.ca/systems-services/payment-systems/real-time-rail-payment-system/technology-and-innovation | Sandbox purpose, ISO 20022 adoption guidance |
| `PC-RTR-NEWS-SBX` | Explore the RTR sandbox API environment | https://www.payments.ca/explore-real-time-rail-sandbox-api-environment | Sandbox availability / readiness messaging |
| `PC-RTR-ISO-HUB` | RTR ISO 20022 message specifications hub | https://payments.ca/node/181 | Official message specs (head/pacs/admi) and flow diagrams |
| `PC-RTR-FACT` | Sandbox RTR API Factsheet (PDF) | https://payments.ca/sites/default/files/2022-07/PaymentsCanada_SandboxRTR_API_Factsheet_En.pdf | Exchange inbound/outbound capability descriptions |
| `PC-API-TOOLKIT` | Official API toolkit (OpenAPI + Postman) | https://github.com/paymentscanada/api-toolkit | Concrete schemas, headers, Postman samples |
| `PC-GETTING-STARTED` | Developer Portal Getting Started | https://developer.payments.ca/getting-started | Registration, My Apps, OAuth token usage |
| `PC-ACCESS-TOKEN` | Access Token Generation API | https://developer.payments.ca/access-token-generation/apis/post/accesstoken | Client-credentials authentication |

### Official ISO 20022 message artefacts referenced by Payments Canada

| Message | Spec family | Payments Canada artefact (from `PC-RTR-ISO-HUB`) | Sandbox role |
| --- | --- | --- | --- |
| `head.001` | Business Application Header | RTR business application header (head.001) | Wrapper on all RTR messages |
| `pacs.008` | FI to FI Customer Credit Transfer | RTR FI to FI customer credit transfer (pacs.008) | Send payment |
| `pacs.002` | FI to FI Payment Status Report | RTR FI to FI payment status report (pacs.002) | Payment / enquiry response |
| `pacs.028` | FI to FI Payment Status Request | RTR FI to FI payment status request (pacs.028) | Payment status enquiry |
| `admi.002` | Message Reject | RTR message reject (admi.002) | Syntax / validation reject |
| `admi.004` | System Event Notification | RTR system event notification (admi.004) | Heartbeat request |
| `admi.011` | System Event Acknowledgement | RTR system event acknowledgement (admi.011) | Heartbeat response |
| `camt.003` | Get Account | Used by sandbox Interest / Balance APIs | C&S report request |
| `camt.004` | Return Account | Used by sandbox Interest / Balance APIs | C&S report response |

> Note: Full PDF/Excel message usage guidelines remain on Payments Canada / Swift MyStandards. This matrix maps **sandbox REST usage** to those message families.

---

## 2. Traceability ID scheme

| Prefix | Meaning | Example |
| --- | --- | --- |
| `PC-...` | Payments Canada source reference | `PC-RTR-PORTAL` |
| `REQ-...` | Business / technical requirement derived from PC guidance | `REQ-AUTH-001` |
| `MSG-...` | ISO 20022 message requirement | `MSG-PACS008-001` |
| `API-...` | Sandbox REST endpoint capability | `API-PAY-001` |
| `CTR-...` | Section in our API contract | `CTR-SEND` |
| `APP-...` | Implementation artefact in this repo | `APP-CLIENT-SEND` |
| `TST-...` | Verification / test scenario | `TST-E2E-001` |
| `GAP-...` | Known gap / deferred item | `GAP-JWS-001` |

---

## 3. Requirements ← Payments Canada guidelines

| Req ID | Requirement statement | Derived from | Priority | Coverage status |
| --- | --- | --- | --- | --- |
| `REQ-AUTH-001` | Developers must register and create a product-specific app to call sandbox APIs | `PC-GETTING-STARTED`, `PC-RTR-TECH` | Must | Covered |
| `REQ-AUTH-002` | Calls must use OAuth 2.0 client-credentials access token | `PC-ACCESS-TOKEN`, `PC-GETTING-STARTED`, OpenAPI security scheme | Must | Covered |
| `REQ-AUTH-003` | RTR sandbox calls require app product `rtr-sandbox-product` | Live portal product binding / toolkit pre-requisites | Must | Covered |
| `REQ-ISO-001` | RTR transactions use ISO 20022 messaging | `PC-RTR-PORTAL`, `PC-RTR-TECH`, `PC-RTR-ISO-HUB` | Must | Covered |
| `REQ-EXCH-001` | Participant/CSP can send credit transfer using pacs.008; Exchange responds pacs.002 or admi.002 | `PC-RTR-PORTAL`, `PC-RTR-FACT`, `PC-RTR-ISO-HUB` | Must | Covered |
| `REQ-EXCH-002` | Participant can enquire payment status using pacs.028; response pacs.002 or admi.002 | `PC-RTR-PORTAL`, `PC-RTR-FACT`, `PC-RTR-ISO-HUB` | Must | Covered |
| `REQ-EXCH-003` | Participant/CSP can send heartbeat admi.004; Exchange responds admi.011 or admi.002 | `PC-RTR-PORTAL`, `PC-RTR-ISO-HUB` | Must | Covered |
| `REQ-CNS-001` | Participant can request Interest Report via camt.003; C&S returns camt.004 or admi.002 | `PC-RTR-PORTAL` | Should | Covered |
| `REQ-CNS-002` | Participant can request Balance / payment-capacity report via camt.003; C&S returns camt.004 or admi.002 | `PC-RTR-PORTAL` | Should | Partial (sandbox often empty body) |
| `REQ-HDR-001` | Requests include Business Application Header (head.001 mapping) | `PC-RTR-ISO-HUB`, toolkit BAH schema | Must | Covered |
| `REQ-HDR-002` | Payment tracking uses UETR (`x-uetr` / payment identification) | Toolkit OpenAPI parameters | Must | Covered |
| `REQ-HDR-003` | Traceability ID should correlate a call across systems | Toolkit `traceability-id` parameter | Should | Covered |
| `REQ-HDR-004` | Payload integrity via `x-jws-signature` | Toolkit OpenAPI (required in schema) | Should (prod) / Optional (sandbox observed) | Gap noted |
| `REQ-VAL-001` | Syntax validation failures return Message Reject admi.002 | `PC-RTR-PORTAL`, `PC-RTR-ISO-HUB` | Must | Covered |
| `REQ-UX-001` | Sandbox enables exploration with stubbed non-production data | `PC-RTR-TECH`, `PC-GETTING-STARTED` | Must | Covered |
| `REQ-SEC-001` | Consumer secrets must not be embedded in public clients | Portal security practice / standard API hygiene | Must | Covered (server-side proxy) |

---

## 4. Message specification mapping

| Msg ID | ISO message | PC guideline capability | Direction | Request message def | Expected response | Contract section | App artefact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MSG-PACS008-001` | pacs.008.001.08 | Exchange Inbound — Send payment | Inbound to Exchange | `pacs.008.001.08` | pacs.002 / admi.002 | `CTR-SEND` | `server/scenarios.js` `send-payment`; `docs/RTR-REST-API-CONTRACT.md` §3 |
| `MSG-PACS028-001` | pacs.028.001.03 | Exchange Inbound — Payment enquiry | Inbound to Exchange | `pacs.028.001.03` | pacs.002 / admi.002 | `CTR-STATUS` | `payment-status` scenario; contract §4 |
| `MSG-PACS002-001` | pacs.002.001.10 | Payment Status Report | Outbound from Exchange | n/a (response) | Status codes e.g. `ACSP` | `CTR-SEND`, `CTR-STATUS` | `client/src/lib/responseReader.js` |
| `MSG-ADMI004-001` | admi.004.001.02 | Heartbeat request (participant → Exchange) | Inbound to Exchange | `admi.004.001.02` | admi.011 / admi.002 | `CTR-HEARTBEAT` | `heartbeat` scenario; contract §5 |
| `MSG-ADMI011-001` | admi.011.001.01 | Heartbeat acknowledgement | Outbound from Exchange | n/a (response) | `HBRT` ack | `CTR-HEARTBEAT` | response reader heartbeat summary |
| `MSG-ADMI002-001` | admi.002.001.01 | Message reject on validation failure | Outbound from Exchange/C&S | n/a (response) | reject code + description | `CTR-REJECT` | `send-payment-reject` scenario |
| `MSG-CAMT003-INT` | camt.003.001.07 | C&S Interest report request | Inbound to C&S | `camt.003.001.07` | camt.004 / admi.002 | `CTR-INTEREST` | `interest-report` scenario; contract §6 |
| `MSG-CAMT003-BAL` | camt.003.001.07 | C&S Balance report request | Inbound to C&S | `camt.003.001.07` | camt.004 / admi.002 | `CTR-BALANCE` | `balance-eod`, `balance-current`; contract §7 |
| `MSG-CAMT004-001` | camt.004.001.08 | C&S Return Account report | Outbound from C&S | n/a (response) | balances / interest lines | `CTR-INTEREST`, `CTR-BALANCE` | response reader account report |
| `MSG-HEAD001-001` | head.001 (BAH JSON mapping) | Business Application Header on all messages | Both | `business_application_header` | echoed/response BAH | All CTR-* message APIs | builders in `server/scenarios.js` |

### Toolkit schema crosswalk

| Msg ID | Official toolkit file (`PC-API-TOOLKIT`) |
| --- | --- |
| `MSG-PACS008-001` | `swagger-oas/RTR-Sandbox/spec-exchange/FIToFICustomerCreditTransferIncomingV08.yaml` + `R1-Inbound-Participant-PaymentAPI.yml` |
| `MSG-PACS028-001` | `FIToFIPaymentStatusRequestV03.yaml` + Payment API path `/payments/status` |
| `MSG-PACS002-001` | `FIToFIPaymentStatusReportV10.yaml` |
| `MSG-ADMI004-001` / `MSG-ADMI011-001` | `SystemEventNotificationV02.yaml`, `SystemEventAcknowledgementV01.yaml`, `R1-Inbound-CSP-HeartbeatAPI.yml` |
| `MSG-ADMI002-001` | `MessageRejectV01.yaml` |
| `MSG-CAMT003-INT` / `MSG-CAMT004-001` | `spec-CnS/interest-report.yaml`, `spec-CnS/iso_models/camt_003.yaml`, `camt_004.yaml` |
| `MSG-CAMT003-BAL` | `spec-CnS/payment-capacity-balance-report.yaml` |
| `MSG-HEAD001-001` | `BusinessApplicationHeaderV02.yaml` / `head_001.yaml` |
| Headers | `headers.yaml`, `parameters.yaml` (`x-uetr`, `traceability-id`, `x-jws-signature`) |

---

## 5. API capability matrix (guideline → endpoint → contract → app → test)

| API ID | PC capability (guideline text) | REST endpoint | ISO flow | Contract | Implementation | Test ID | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-AUTH-001` | Generate access token for API calls | `POST /accesstoken` | OAuth2 client_credentials | `CTR-TOKEN` (`RTR-REST-API-CONTRACT.md` §2) | `server/rtr-client.js` `getAccessToken` | `TST-AUTH-001` | Pass (live) |
| `API-PAY-001` | Send payment (Exchange Inbound) | `POST /rtr-sandbox/payments` | pacs.008 → pacs.002 | `CTR-SEND` §3 | scenario `send-payment` | `TST-PAY-001` | Pass (live, ACSP) |
| `API-PAY-002` | Syntax validation reject | `POST /rtr-sandbox/payments` | pacs.008 → admi.002 | `CTR-REJECT` §3 | scenario `send-payment-reject` | `TST-PAY-002` | Pass (live, FF02) |
| `API-STS-001` | Payment enquiry | `POST /rtr-sandbox/payments/status` | pacs.028 → pacs.002 | `CTR-STATUS` §4 | scenario `payment-status` | `TST-STS-001` | Pass (live, ACSP) |
| `API-HBT-001` | Heartbeat participant → Exchange | `POST /rtr-sandbox/inbound-heartbeat` | admi.004 → admi.011 | `CTR-HEARTBEAT` §5 | scenario `heartbeat` | `TST-HBT-001` | Pass (live) |
| `API-INT-001` | Interest report | `POST /rtr-sandbox/interest-report` | camt.003 → camt.004 | `CTR-INTEREST` §6 | scenario `interest-report` | `TST-INT-001` | Pass (live) |
| `API-BAL-001` | Balance report (EOD / current) | `POST /rtr-sandbox/payment-capacity-balance-report` | camt.003 → camt.004 | `CTR-BALANCE` §7 | scenarios `balance-eod`, `balance-current` | `TST-BAL-001` | Partial (HTTP 200, empty `{}` observed) |
| `API-E2E-001` | End-to-end send then enquire | `/payments` + `/payments/status` | pacs.008 → pacs.028 → pacs.002 | Contract §0 + §3 + §4 | scenario `e2e-payment-flow`, guided tour | `TST-E2E-001` | Pass (live) |

### Postman collection alignment (`PC-API-TOOLKIT`)

| Toolkit Postman request | API ID | Our scenario ID |
| --- | --- | --- |
| Token | `API-AUTH-001` | `auth-token` |
| Send Payment | `API-PAY-001` | `send-payment` |
| Payment Status (ACSP) - With Instructing and Instructed | `API-STS-001` | `payment-status` |
| Interest Report (ACSP) | `API-INT-001` | `interest-report` |
| Balance Report (ACSP) - End of Recon Cycle | `API-BAL-001` | `balance-eod` |
| Balance Report (ACSP) - Current Balance | `API-BAL-001` | `balance-current` |
| Inbound Heartbeat (ACSP) - RDP | `API-HBT-001` | `heartbeat` |

---

## 6. Header & security controls traceability

| Control ID | PC / toolkit expectation | Our contract rule | Implementation | Compliance |
| --- | --- | --- | --- | --- |
| `CTL-AUTH-BEARER` | OAuth bearer token on API calls | Required `Authorization: Bearer` | `server/rtr-client.js` | Compliant |
| `CTL-CT-VND` | `application/vnd.api.v1+json` | Required content-type/accept | `rtr-client.js` `CONTENT_TYPE` | Compliant |
| `CTL-UETR` | `x-uetr` for pacs.008 / pacs.028 tracking | Recommended/sent on payment APIs | extracted/generated UUID | Compliant (sandbox) |
| `CTL-TRACE` | `traceability-id` UUID per call | Recommended/sent | generated per call | Compliant (sandbox) |
| `CTL-JWS` | `x-jws-signature` for payload signing | Documented; sandbox often works without | Not signed in current sandbox client | `GAP-JWS-001` |
| `CTL-PRODUCT` | App must bind to correct API product | Enforce/detect `rtr-sandbox-product` | health `authMeta.productOk` | Compliant |
| `CTL-SECRET` | Protect consumer secret | Server-side only / `.env` | Express proxy, no secret in browser bundle | Compliant |

---

## 7. Field-level mapping (selected critical fields)

### 7.1 Send Payment (pacs.008)

| Business field | PC/ISO intent | JSON path (sandbox) | Contract | App handling |
| --- | --- | --- | --- | --- |
| Debtor name | Payer identification | `...credit_transfer_transaction_information.debtor.name` | CTR-SEND | Form field + readable request card |
| Creditor name | Payee identification | `...creditor.name` | CTR-SEND | Form field + readable request card |
| Amount / currency | Interbank settlement amount | `...interbank_settlement_amount.amount/currency` | CTR-SEND | Form amount; CAD default |
| UETR | End-to-end tracking UUID | `...payment_identification.uetr` + header `x-uetr` | CTR-SEND | Generated/persisted in session |
| End-to-end ID | Customer reference | `...end_to_end_identification` | CTR-SEND | Generated/persisted |
| Instructing FI | Debtor agent member ID | `...instructing_agent...member_identification` | CTR-SEND | Default `111` (sandbox sample) |
| Instructed FI | Creditor agent member ID | `...instructed_agent...member_identification` | CTR-SEND | Default `999` |
| Clearing system | RTR clearing | `settlement_information.clearing_system.code=RTR` | CTR-SEND | Hard-coded per toolkit sample |
| Local instrument | RTR exchange service | `local_instrument.proprietary=RTREXCHANGE` | CTR-SEND | Hard-coded per toolkit sample |

### 7.2 Payment Status Report (pacs.002)

| Business field | PC/ISO intent | JSON path | App handling |
| --- | --- | --- | --- |
| Transaction status | Acceptance / reject / pending | `...transaction_information_and_status.transaction_status` | Mapped (`ACSP` → “Accepted for settlement”) |
| Original UETR | Correlate to original payment | `...original_uetr` | Display + copy |
| Clearing system reference | Exchange reference | `...clearing_system_reference` | Display + copy |
| Acceptance datetime | When accepted | `...acceptance_date_time` | Formatted local time |

### 7.3 Message Reject (admi.002)

| Business field | PC/ISO intent | JSON path | App handling |
| --- | --- | --- | --- |
| Reject code | Machine reason | `message_reject.reason.rejecting_party_reason` | Error badge (e.g. `FF02`) |
| Reason text | Human diagnostics | `message_reject.reason.reason_description` | Summary text |

---

## 8. Verification evidence

| Test ID | Maps to | Evidence method | Result | Date |
| --- | --- | --- | --- | --- |
| `TST-AUTH-001` | `API-AUTH-001`, `REQ-AUTH-002` | Live `POST /accesstoken` with `rtr-sandbox-product` app | Pass | 2026-07-20 |
| `TST-PAY-001` | `API-PAY-001`, `MSG-PACS008-001` | Live send payment → `pacs.002` `ACSP` | Pass | 2026-07-20 |
| `TST-PAY-002` | `API-PAY-002`, `MSG-ADMI002-001`, `REQ-VAL-001` | Malformed payload → `admi.002` `FF02` | Pass | 2026-07-20 |
| `TST-STS-001` | `API-STS-001`, `MSG-PACS028-001` | Status enquiry using prior UETR/E2E/message id | Pass | 2026-07-20 |
| `TST-HBT-001` | `API-HBT-001`, `MSG-ADMI004-001` | Heartbeat → `admi.011` | Pass | 2026-07-20 |
| `TST-INT-001` | `API-INT-001`, `MSG-CAMT003-INT` | Interest report → `camt.004` with STAB/IAMT | Pass | 2026-07-20 |
| `TST-BAL-001` | `API-BAL-001`, `REQ-CNS-002` | Balance report endpoints | Partial (empty body) | 2026-07-20 |
| `TST-E2E-001` | `API-E2E-001` | Guided tour / e2e scenario | Pass | 2026-07-18 / 2026-07-20 |
| `TST-PRODUCT-001` | `REQ-AUTH-003` | Wrong product (`payments-rail-sandbox`) yields 401 on RTR paths | Pass | 2026-07-18 |

Sample payloads used for evidence:  
`docs/api-examples/rtr-sandbox-live-examples.json`

---

## 9. Coverage summary

| Area | PC guideline items in scope | Fully covered | Partial | Gap |
| --- | --- | --- | --- | --- |
| Authentication / portal app | 3 | 3 | 0 | 0 |
| Exchange inbound (pay/status/heartbeat) | 3 | 3 | 0 | 0 |
| Validation reject | 1 | 1 | 0 | 0 |
| Clearing & Settlement reports | 2 | 1 | 1 | 0 |
| Header controls | 4 | 3 | 0 | 1 (`GAP-JWS-001`) |
| ISO message families (sandbox inbound set) | 9 | 9 | 0 | 0 |

**Overall sandbox inbound scope coverage:** High for Exchange + Interest Report; Balance Report response body is sandbox-limited; JWS signing deferred for sandbox.

---

## 10. Gaps and out-of-scope (explicit)

| Gap ID | Description | PC reference | Impact | Planned handling |
| --- | --- | --- | --- | --- |
| `GAP-JWS-001` | Request/response JWS (`x-jws-signature`) not implemented in current client | Toolkit OpenAPI required header | Needed for production-grade integrity | Add signing/verification before production onboarding |
| `GAP-BAL-001` | Balance report returns empty `{}` in current sandbox stub | `PC-RTR-PORTAL` balance capability | Cannot assert camt.004 body in sandbox today | Keep request contract; re-test when sandbox data enriched |
| `GAP-OUTBOUND-001` | Exchange **outbound** APIs (Exchange → participant pacs.008/pacs.002/admi.004) not implemented | `PC-RTR-FACT` outbound section | Required for full participant/CSP connectivity | Future phase (webhook/receiver endpoints) |
| `GAP-PROD-PARTICIPATION-001` | Production RTR participation / membership onboarding not in this repo | Payments Canada membership / RTR participation rules | Sandbox ≠ production access | Separate compliance & connectivity workstream |
| `GAP-MYSTANDARDS-001` | Swift MyStandards detailed usage rules not embedded | `PC-RTR-ISO-HUB` note | Deep schema constraints may differ by release | Track PC companion docs + MyStandards updates |

---

## 11. Forward / backward traceability views

### 11.1 Forward (guideline → build)
`PC-RTR-PORTAL` Send payment  
→ `REQ-EXCH-001`  
→ `MSG-PACS008-001` / `API-PAY-001`  
→ `CTR-SEND`  
→ `APP` scenario `send-payment` + response reader  
→ `TST-PAY-001`

### 11.2 Backward (defect → guideline)
If payment status UI mislabels `ACSP`:  
`responseReader` status map  
→ `MSG-PACS002-001`  
→ `REQ-EXCH-001` / `PC-RTR-ISO-HUB` pacs.002  
→ update mapping + `TST-STS-001`

---

## 12. Document control

| Item | Value |
| --- | --- |
| Owner | RTR integration team |
| Related docs | `RTR-REST-API-CONTRACT.md`, `RTR-API-QUICK-REFERENCE.md`, `api-examples/rtr-sandbox-live-examples.json` |
| Related code | `server/scenarios.js`, `server/rtr-client.js`, `client/src/lib/responseReader.js` |
| Review cadence | On each Payments Canada sandbox/spec update |
| Classification | Internal – share with implementation & QA partners |

### Change log

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-07-20 | Initial traceability matrix against PC sandbox guidelines, ISO message set, toolkit, contract, and live verification |
