# RTR Rail Lab

Interactive explorer for the [Payments Canada Real-Time Rail (RTR) sandbox APIs](https://developer.payments.ca/rtr-sandbox-api/apis).

Covers every scenario from Payments Canada’s public Postman collection and OpenAPI specs:

| Scenario | ISO message | Endpoint |
| --- | --- | --- |
| Generate OAuth token | OAuth 2.0 client credentials | `POST /accesstoken` |
| Send payment | pacs.008 → pacs.002 | `POST /rtr-sandbox/payments` |
| Send payment (reject path) | pacs.008 → admi.002 | `POST /rtr-sandbox/payments` |
| Payment status enquiry | pacs.028 → pacs.002 | `POST /rtr-sandbox/payments/status` |
| Inbound heartbeat | admi.004 → admi.011 | `POST /rtr-sandbox/inbound-heartbeat` |
| Interest report | camt.003 → camt.004 | `POST /rtr-sandbox/interest-report` |
| Balance report (EOD) | camt.003 → camt.004 | `POST /rtr-sandbox/payment-capacity-balance-report` |
| Balance report (current) | camt.003 → camt.004 | `POST /rtr-sandbox/payment-capacity-balance-report` |
| End-to-end flow | pacs.008 → pacs.028 | Multi-step |

## Prerequisites

1. Register on the [Developer Portal](https://developer.payments.ca/).
2. Create an app with product **`rtr-sandbox-product`** (required for `/rtr-sandbox/*`).
3. Copy the **Consumer Key** and **Consumer Secret**.

> Note: An app created under **`payments-rail-sandbox`** can obtain an OAuth token,
> but RTR calls return `401 Invalid token. Please generate token for correct API Application.`
> Create a separate app for the RTR sandbox product.

## Quick start

```bash
cd rtr-sandbox-app
cp .env.example .env
# Edit .env and paste your Consumer Key / Secret

npm run install:all
npm run dev
```

- UI: http://localhost:5173  
- API: http://localhost:8787  

Without credentials, the app runs in **demo mode** with stubbed ISO 20022-shaped responses so every scenario stays interactive.

## Production-style serve

```bash
npm run build
npm start
```

Serves the built UI from the Express server on `PORT` (default `8787`).

## How it works

- **Express proxy** (`server/`) holds credentials, obtains OAuth tokens, and calls `https://api.payments.ca/rtr-sandbox/*` with `application/vnd.api.v1+json`.
- **React UI** (`client/`) lists scenarios, lets you edit request fields, and shows request/response side-by-side.
- **Response reader** (`client/src/lib/responseReader.js`) decodes ISO 20022 payloads into plain-language cards:
  payment status (ACSP/RJCT), heartbeat ack, interest/balance tables, reject reasons, and OAuth token details. Raw JSON remains available behind toggles.
- Official samples referenced: [paymentscanada/api-toolkit](https://github.com/paymentscanada/api-toolkit).

## Notes

- Sandbox tokens expire in about **5 minutes**; each run fetches a fresh token in live mode.
- This app is for sandbox exploration only — not production RTR participation.
