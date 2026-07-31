import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildPaymentStatusPayload,
  buildSendPaymentPayload,
  getScenario,
  getScenarioCatalog,
} from "./scenarios.js";
import {
  balanceReport,
  getAccessToken,
  getAuthMeta,
  hasLiveCredentials,
  heartbeat,
  interestReport,
  paymentStatus,
  sendPayment,
  setCredentials,
} from "./rtr-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  let authMeta = getAuthMeta();
  if (hasLiveCredentials() && !authMeta) {
    try {
      await getAccessToken();
      authMeta = getAuthMeta();
    } catch {
      authMeta = null;
    }
  }

  res.json({
    ok: true,
    mode: hasLiveCredentials() ? "live" : "demo",
    requiredProduct: "rtr-sandbox-product",
    apiBase: process.env.API_BASE_URL || "https://api.payments.ca",
    hasCredentials: hasLiveCredentials(),
    consumerKeyHint: hasLiveCredentials()
      ? `${process.env.CONSUMER_KEY.slice(0, 4)}…${process.env.CONSUMER_KEY.slice(-4)}`
      : null,
    authMeta,
  });
});

app.post("/api/credentials", (req, res) => {
  const { consumerKey, consumerSecret } = req.body || {};
  if (!consumerKey || !consumerSecret) {
    return res.status(400).json({
      ok: false,
      error: "consumerKey and consumerSecret are required",
    });
  }
  const result = setCredentials({ consumerKey, consumerSecret });
  res.json({ ok: true, ...result });
});

app.get("/api/scenarios", (_req, res) => {
  res.json({
    mode: hasLiveCredentials() ? "live" : "demo",
    scenarios: getScenarioCatalog(),
  });
});

app.post("/api/token", async (_req, res) => {
  try {
    const result = await getAccessToken();
    res.status(result.status || 200).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      mode: hasLiveCredentials() ? "live" : "demo",
    });
  }
});

app.post("/api/run/:scenarioId", async (req, res) => {
  const scenario = getScenario(req.params.scenarioId);
  if (!scenario) {
    return res.status(404).json({ ok: false, error: "Unknown scenario" });
  }

  const form = req.body?.form || {};
  const startedAt = new Date().toISOString();

  try {
    if (scenario.method === "token") {
      const result = await getAccessToken();
      return res.json({
        scenarioId: scenario.id,
        startedAt,
        finishedAt: new Date().toISOString(),
        steps: [
          {
            name: "Generate access token",
            endpoint: "POST /accesstoken",
            result,
          },
        ],
      });
    }

    if (scenario.method === "e2e") {
      const paymentPayload = buildSendPaymentPayload({
        ...form,
        amount: Number(form.amount ?? 250),
      });
      const payResult = await sendPayment(paymentPayload);
      const tx =
        paymentPayload.fi_to_fi_customer_credit_transfer
          .credit_transfer_transaction_information.payment_identification;
      const statusPayload = buildPaymentStatusPayload({
        fromMember: form.fromMember || "111",
        toMember: form.toMember || "999",
        originalMessageId:
          paymentPayload.fi_to_fi_customer_credit_transfer.group_header
            .message_identification,
        originalEndToEndId: tx.end_to_end_identification,
        originalUetr: tx.uetr,
      });
      const statusResult = await paymentStatus(statusPayload);

      return res.json({
        scenarioId: scenario.id,
        startedAt,
        finishedAt: new Date().toISOString(),
        steps: [
          {
            name: "Send payment (pacs.008)",
            endpoint: "POST /rtr-sandbox/payments",
            requestBody: paymentPayload,
            result: payResult,
          },
          {
            name: "Payment status enquiry (pacs.028)",
            endpoint: "POST /rtr-sandbox/payments/status",
            requestBody: statusPayload,
            result: statusResult,
          },
        ],
      });
    }

    const payload =
      typeof scenario.buildPayload === "function"
        ? scenario.buildPayload(form)
        : req.body?.payload || {};

    let result;
    const expectReject = scenario.id === "send-payment-reject";

    switch (scenario.method) {
      case "payments":
        result = await sendPayment(payload, { expectReject });
        break;
      case "payments-status":
        result = await paymentStatus(payload);
        break;
      case "heartbeat":
        result = await heartbeat(payload);
        break;
      case "interest-report":
        result = await interestReport(payload);
        break;
      case "balance-report":
        result = await balanceReport(payload);
        break;
      default:
        return res.status(400).json({ ok: false, error: "Unsupported method" });
    }

    return res.json({
      scenarioId: scenario.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      steps: [
        {
          name: scenario.title,
          endpoint: scenario.endpoint,
          requestBody: payload,
          result,
        },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      scenarioId: scenario.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.post("/api/proxy/:action", async (req, res) => {
  const action = req.params.action;
  const payload = req.body?.payload || req.body || {};
  try {
    let result;
    switch (action) {
      case "payments":
        result = await sendPayment(payload);
        break;
      case "payments-status":
        result = await paymentStatus(payload);
        break;
      case "heartbeat":
        result = await heartbeat(payload);
        break;
      case "interest-report":
        result = await interestReport(payload);
        break;
      case "balance-report":
        result = await balanceReport(payload);
        break;
      default:
        return res.status(404).json({ ok: false, error: "Unknown action" });
    }
    res.status(result.status || 200).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, "0.0.0.0", () => {
  const mode = hasLiveCredentials() ? "LIVE" : "DEMO";
  console.log(`RTR Sandbox Explorer listening on http://localhost:${PORT}`);
  console.log(`Mode: ${mode}`);
  if (mode === "DEMO") {
    console.log(
      "Add CONSUMER_KEY and CONSUMER_SECRET to .env for live sandbox calls."
    );
  }
});
