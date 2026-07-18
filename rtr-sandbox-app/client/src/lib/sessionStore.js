const STORAGE_KEY = "rtr-rail-lab-session-v1";

const DEFAULT_STATE = {
  completedIds: [],
  lastPayment: null,
  activity: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSession() {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      lastPayment: parsed.lastPayment || null,
      activity: Array.isArray(parsed.activity) ? parsed.activity.slice(0, 30) : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveSession(state) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function dig(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function extractPaymentContext(run) {
  if (!run?.steps?.length) return null;

  for (const step of run.steps) {
    const request = step.requestBody || {};
    const response = step.result?.data || {};

    const reqTx =
      request.fi_to_fi_customer_credit_transfer
        ?.credit_transfer_transaction_information || {};
    const resTx =
      response.fi_to_fi_payment_status_report?.transaction_information_and_status ||
      {};

    const uetr =
      dig(reqTx, "payment_identification.uetr") ||
      resTx.original_uetr ||
      null;
    const endToEndId =
      dig(reqTx, "payment_identification.end_to_end_identification") ||
      resTx.original_end_to_end_identification ||
      null;
    const messageId =
      dig(request, "fi_to_fi_customer_credit_transfer.group_header.message_identification") ||
      dig(resTx, "original_group_information.original_message_identification") ||
      null;
    const status = resTx.transaction_status || null;
    const amount = dig(reqTx, "interbank_settlement_amount.amount");
    const currency = dig(reqTx, "interbank_settlement_amount.currency") || "CAD";
    const debtor = dig(reqTx, "debtor.name");
    const creditor = dig(reqTx, "creditor.name");
    const fromMember = dig(
      reqTx,
      "instructing_agent.financial_institution_identification.clearing_system_member_identification.member_identification"
    );
    const toMember = dig(
      reqTx,
      "instructed_agent.financial_institution_identification.clearing_system_member_identification.member_identification"
    );

    if (uetr || endToEndId || messageId) {
      return {
        uetr,
        endToEndId,
        messageId,
        status,
        amount,
        currency,
        debtor,
        creditor,
        fromMember: fromMember || "111",
        toMember: toMember || "999",
        capturedAt: new Date().toISOString(),
        scenarioId: run.scenarioId,
      };
    }
  }

  return null;
}

export function summarizeRun(run) {
  const last = run?.steps?.[run.steps.length - 1];
  const data = last?.result?.data || {};
  const status =
    data?.fi_to_fi_payment_status_report?.transaction_information_and_status
      ?.transaction_status ||
    data?.message_reject?.reason?.rejecting_party_reason ||
    (data?.access_token ? "TOKEN" : null) ||
    (data?.system_event_acknowledgement ? "HBRT_ACK" : null) ||
    (data?.return_account ? "REPORT" : null) ||
    (last?.result?.ok ? "OK" : "ERROR");

  const http = last?.result?.status ?? null;
  const ok = Boolean(last?.result?.ok !== false && (http ?? 200) < 400);

  return {
    id: `${run.scenarioId}-${run.finishedAt || Date.now()}`,
    scenarioId: run.scenarioId,
    title: last?.name || run.scenarioId,
    at: run.finishedAt || new Date().toISOString(),
    ok,
    http,
    status,
  };
}

export const STATUS_GLOSSARY = [
  {
    code: "ACSP",
    meaning: "Accepted for settlement",
    tip: "RTR accepted the payment instruction. Settlement processing can proceed.",
  },
  {
    code: "ACSC",
    meaning: "Settlement completed",
    tip: "Settlement has completed for the payment.",
  },
  {
    code: "RJCT",
    meaning: "Rejected",
    tip: "The payment was rejected. Check status reason codes in the response.",
  },
  {
    code: "PDNG",
    meaning: "Pending",
    tip: "Still in progress. Run Payment Status Enquiry again shortly.",
  },
  {
    code: "FF01 / FF02",
    meaning: "Format / validation reject",
    tip: "Message failed syntax or schema validation (often seen with admi.002).",
  },
  {
    code: "HBRT",
    meaning: "Heartbeat",
    tip: "Application-level ping. Expect admi.011 acknowledgement when healthy.",
  },
  {
    code: "UETR",
    meaning: "Unique End-to-end Transaction Reference",
    tip: "UUID used to track a credit transfer across systems.",
  },
];

export const GUIDED_STEPS = [
  {
    id: "auth-token",
    title: "Connect",
    description: "Get an OAuth access token",
  },
  {
    id: "heartbeat",
    title: "Health check",
    description: "Confirm Exchange responds to heartbeat",
  },
  {
    id: "send-payment",
    title: "Send payment",
    description: "Submit a pacs.008 credit transfer",
  },
  {
    id: "payment-status",
    title: "Check status",
    description: "Enquire with pacs.028 using the payment IDs",
  },
];
