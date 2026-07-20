# RTR Sandbox API — Quick Reference (for developers)

Base: `https://api.payments.ca`

| # | API | Method | Path | ISO in → out | Auth |
| ---: | --- | --- | --- | --- | --- |
| 1 | Access Token | `POST` | `/accesstoken` | OAuth | Basic (key:secret) |
| 2 | Send Payment | `POST` | `/rtr-sandbox/payments` | pacs.008 → pacs.002 / admi.002 | Bearer |
| 3 | Payment Status | `POST` | `/rtr-sandbox/payments/status` | pacs.028 → pacs.002 / admi.002 | Bearer |
| 4 | Heartbeat | `POST` | `/rtr-sandbox/inbound-heartbeat` | admi.004 → admi.011 / admi.002 | Bearer |
| 5 | Interest Report | `POST` | `/rtr-sandbox/interest-report` | camt.003 → camt.004 / admi.002 | Bearer |
| 6 | Balance Report | `POST` | `/rtr-sandbox/payment-capacity-balance-report` | camt.003 → camt.004 / admi.002 | Bearer |

## Headers by API

### Token
```http
Authorization: Basic <base64(consumerKey:consumerSecret)>
Content-Type: application/x-www-form-urlencoded
```

### All RTR APIs
```http
Authorization: Bearer <access_token>
Content-Type: application/vnd.api.v1+json
Accept: application/vnd.api.v1+json
x-uetr: <uuid>                 # strongly recommended for payments/status
traceability-id: <uuid>        # recommended for all calls
```

## Request root objects

| API | Request root fields |
| --- | --- |
| Send Payment | `business_application_header` + `fi_to_fi_customer_credit_transfer` |
| Payment Status | `business_application_header` + `fi_to_fi_payment_status_request` |
| Heartbeat | `business_application_header` + `system_event_notification` |
| Interest / Balance | `business_application_header` + `get_account` |

## Response root objects

| API | Success response roots |
| --- | --- |
| Send / Status | `business_application_header` + `fi_to_fi_payment_status_report` |
| Heartbeat | `business_application_header` + `system_event_acknowledgement` |
| Interest / Balance | `business_application_header` + `return_account` |
| Validation fail | `business_application_header` + `message_reject` |

## Must-handle fields in app code

| Business need | JSON path |
| --- | --- |
| Payment accepted? | `fi_to_fi_payment_status_report.transaction_information_and_status.transaction_status` (`ACSP`) |
| Track payment | `...original_uetr` / request `payment_identification.uetr` |
| Reject reason | `message_reject.reason.rejecting_party_reason` + `reason_description` |
| Heartbeat OK? | presence of `system_event_acknowledgement` with `event_code=HBRT` |
| Interest amount | `return_account.report_or_error.account_report[].account_or_error.account.multilateral_balance` where `type.proprietary=IAMT` |

Full contract with sample payloads: [RTR-REST-API-CONTRACT.md](./RTR-REST-API-CONTRACT.md)
