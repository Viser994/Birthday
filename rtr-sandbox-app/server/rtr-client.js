import { randomUUID } from "crypto";
import {
  demoAccountReport,
  demoHeartbeatAck,
  demoMessageReject,
  demoPaymentStatus,
  demoToken,
} from "./demo-responses.js";

const API_BASE_URL = process.env.API_BASE_URL || "https://api.payments.ca";
const RTR_BASE_PATH = process.env.RTR_BASE_PATH || "/rtr-sandbox";
const CONTENT_TYPE = "application/vnd.api.v1+json";
const REQUIRED_PRODUCT = "rtr-sandbox";

let lastAuthMeta = null;

export function hasLiveCredentials() {
  if (process.env.FORCE_DEMO_MODE === "true") return false;
  return Boolean(
    process.env.CONSUMER_KEY &&
      process.env.CONSUMER_SECRET &&
      process.env.CONSUMER_KEY !== "your_consumer_key_here"
  );
}

export function setCredentials({ consumerKey, consumerSecret }) {
  process.env.CONSUMER_KEY = consumerKey?.trim() || "";
  process.env.CONSUMER_SECRET = consumerSecret?.trim() || "";
  lastAuthMeta = null;
  return {
    mode: hasLiveCredentials() ? "live" : "demo",
    hasCredentials: hasLiveCredentials(),
  };
}

export function getAuthMeta() {
  return lastAuthMeta;
}

function productMatchesRtr(products = []) {
  const list = Array.isArray(products) ? products : [products].filter(Boolean);
  return list.some((p) =>
    String(p).toLowerCase().includes(REQUIRED_PRODUCT)
  );
}

function extractUetr(body) {
  return (
    body?.fi_to_fi_customer_credit_transfer
      ?.credit_transfer_transaction_information?.payment_identification?.uetr ||
    body?.fi_to_fi_payment_status_request?.transaction_information
      ?.original_uetr ||
    randomUUID()
  );
}

async function parseResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data,
  };
}

export async function getAccessToken() {
  if (!hasLiveCredentials()) {
    lastAuthMeta = {
      mode: "demo",
      ok: true,
      products: ["demo"],
      productOk: true,
      requiredProductHint: "rtr-sandbox-product",
    };
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {},
      data: demoToken(),
      mode: "demo",
      authMeta: lastAuthMeta,
    };
  }

  const basic = Buffer.from(
    `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "client_credentials",
  });

  const response = await fetch(`${API_BASE_URL}/accesstoken`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const parsed = await parseResponse(response);
  const products =
    parsed.data?.api_product_list_json ||
    (parsed.data?.api_product_list
      ? [String(parsed.data.api_product_list).replace(/^\[|\]$/g, "")]
      : []);
  const productOk = productMatchesRtr(products);
  lastAuthMeta = {
    mode: "live",
    ok: Boolean(parsed.ok && parsed.data?.access_token),
    products,
    productOk,
    requiredProductHint: "rtr-sandbox-product",
    applicationName: parsed.data?.application_name,
    developerEmail: parsed.data?.["developer.email"],
    warning: productOk
      ? null
      : `Token is valid for [${products.join(", ") || "unknown"}], but RTR endpoints require an app created with product rtr-sandbox-product. Create a new app in My Apps with that product, then paste the new Consumer Key/Secret.`,
  };

  return { ...parsed, mode: "live", authMeta: lastAuthMeta };
}

async function callRtr(path, payload, { token, expectReject = false } = {}) {
  if (!hasLiveCredentials()) {
    let data;
    if (
      expectReject ||
      (path === "/payments" &&
        !payload?.fi_to_fi_customer_credit_transfer
          ?.credit_transfer_transaction_information)
    ) {
      data = demoMessageReject();
    } else if (path === "/payments" || path === "/payments/status") {
      data = demoPaymentStatus(payload, "ACSP");
    } else if (path === "/inbound-heartbeat") {
      data = demoHeartbeatAck(payload);
    } else if (path === "/interest-report") {
      data = demoAccountReport("interest", payload);
    } else if (path === "/payment-capacity-balance-report") {
      data = demoAccountReport("balance", payload);
    } else {
      data = { message: "Unknown demo path", path };
    }

    return {
      ok: !expectReject,
      status: expectReject ? 400 : 200,
      statusText: expectReject ? "Bad Request" : "OK",
      headers: {
        "content-type": CONTENT_TYPE,
        "x-demo-mode": "true",
        "traceability-id": randomUUID(),
      },
      data,
      mode: "demo",
      request: {
        url: `${API_BASE_URL}${RTR_BASE_PATH}${path}`,
        method: "POST",
        headers: {
          Authorization: "Bearer <demo-token>",
          "Content-Type": CONTENT_TYPE,
          Accept: CONTENT_TYPE,
          "x-uetr": extractUetr(payload),
          "traceability-id": randomUUID(),
        },
        body: payload,
      },
    };
  }

  const access =
    token ||
    (await getAccessToken()).data?.access_token ||
    (await getAccessToken()).data?.accessToken;

  if (!access) {
    return {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      data: { error: "Unable to obtain access token" },
      mode: "live",
    };
  }

  const uetr = extractUetr(payload);
  const traceabilityId = randomUUID();
  const url = `${API_BASE_URL}${RTR_BASE_PATH}${path}`;
  const headers = {
    Authorization: `Bearer ${access}`,
    "Content-Type": CONTENT_TYPE,
    Accept: CONTENT_TYPE,
    "x-uetr": uetr,
    "traceability-id": traceabilityId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);
  return {
    ...parsed,
    mode: "live",
    request: {
      url,
      method: "POST",
      headers: { ...headers, Authorization: "Bearer ***" },
      body: payload,
    },
  };
}

export async function sendPayment(payload, options) {
  return callRtr("/payments", payload, options);
}

export async function paymentStatus(payload, options) {
  return callRtr("/payments/status", payload, options);
}

export async function heartbeat(payload, options) {
  return callRtr("/inbound-heartbeat", payload, options);
}

export async function interestReport(payload, options) {
  return callRtr("/interest-report", payload, options);
}

export async function balanceReport(payload, options) {
  return callRtr("/payment-capacity-balance-report", payload, options);
}
