import { randomUUID } from "crypto";

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return nowIso().slice(0, 10);
}

function msgId(prefix = "MSG") {
  return `${prefix}${Date.now().toString().slice(-10)}`;
}

export function buildBusinessApplicationHeader({
  fromMember,
  toOrg = "RTR",
  messageDefinitionIdentifier,
  businessMessageIdentifier,
}) {
  return {
    from: {
      financial_institution_identification: {
        financial_institution_identification: {
          clearing_system_member_identification: {
            member_identification: fromMember,
          },
        },
      },
    },
    to: {
      organisation_identification: {
        identification: {
          organisation_identification: {
            other: {
              identification: toOrg,
            },
          },
        },
      },
    },
    business_message_identifier: businessMessageIdentifier,
    message_definition_identifier: messageDefinitionIdentifier,
    creation_date: nowIso(),
  };
}

export function buildSendPaymentPayload(overrides = {}) {
  const creation = nowIso();
  const messageId = overrides.messageId || msgId("PAY");
  const endToEnd = overrides.endToEndId || msgId("E2E");
  const uetr = overrides.uetr || randomUUID();
  const fromMember = overrides.fromMember || "111";
  const toMember = overrides.toMember || "999";
  const amount = overrides.amount ?? 100;

  return {
    business_application_header: buildBusinessApplicationHeader({
      fromMember,
      toOrg: "RTR",
      messageDefinitionIdentifier: "pacs.008.001.08",
      businessMessageIdentifier: messageId,
    }),
    fi_to_fi_customer_credit_transfer: {
      group_header: {
        message_identification: messageId,
        creation_date_time: creation,
        number_of_transactions: "1",
        settlement_information: {
          settlement_method: "CLRG",
          clearing_system: { code: "RTR" },
        },
      },
      credit_transfer_transaction_information: {
        payment_identification: {
          end_to_end_identification: endToEnd,
          uetr,
        },
        payment_type_information: {
          local_instrument: { proprietary: "RTREXCHANGE" },
        },
        interbank_settlement_amount: {
          currency: "CAD",
          amount,
        },
        interbank_settlement_date: todayIso(),
        charge_bearer: "SLEV",
        instructing_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: fromMember,
            },
          },
        },
        instructed_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: toMember,
            },
          },
        },
        debtor: { name: overrides.debtorName || "Mr. Zhang" },
        debtor_account: {
          identification: {
            other: { identification: overrides.debtorAccount || "12345-123456" },
          },
        },
        debtor_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: fromMember,
            },
          },
        },
        creditor_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: toMember,
            },
          },
        },
        creditor: { name: overrides.creditorName || "Ms. Chloé" },
        creditor_account: {
          identification: {
            other: {
              identification: overrides.creditorAccount || "54321-654321",
            },
          },
        },
      },
    },
  };
}

export function buildPaymentStatusPayload(overrides = {}) {
  const creation = nowIso();
  const messageId = overrides.messageId || msgId("STS");
  const fromMember = overrides.fromMember || "111";

  return {
    business_application_header: buildBusinessApplicationHeader({
      fromMember,
      toOrg: "RTR",
      messageDefinitionIdentifier: "pacs.028.001.03",
      businessMessageIdentifier: messageId,
    }),
    fi_to_fi_payment_status_request: {
      group_header: {
        message_identification: messageId,
        creation_date_time: creation,
      },
      transaction_information: {
        original_group_information: {
          original_message_identification:
            overrides.originalMessageId || "12345678900001",
          original_message_name_identification: "pacs.008.001.08",
        },
        original_end_to_end_identification:
          overrides.originalEndToEndId || "1234567890111",
        original_uetr: overrides.originalUetr || randomUUID(),
        instructing_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: fromMember,
            },
          },
        },
        instructed_agent: {
          financial_institution_identification: {
            clearing_system_member_identification: {
              member_identification: overrides.toMember || "999",
            },
          },
        },
      },
    },
  };
}

export function buildHeartbeatPayload(overrides = {}) {
  const messageId = overrides.messageId || msgId("HBT");
  const fromMember = overrides.fromMember || "111";

  return {
    business_application_header: buildBusinessApplicationHeader({
      fromMember,
      toOrg: "RTR",
      messageDefinitionIdentifier: "admi.004.001.02",
      businessMessageIdentifier: messageId,
    }),
    system_event_notification: {
      event_information: {
        event_code: "HBRT",
        event_description: overrides.eventDescription || msgId("EVT"),
      },
    },
  };
}

export function buildInterestReportPayload(overrides = {}) {
  const creation = nowIso();
  const messageId = overrides.messageId || msgId("INT");
  const fromMember = overrides.fromMember || "001";
  const queryName =
    overrides.queryName ||
    `${fromMember}_IntRep_${todayIso().replaceAll("-", "")}001`;

  return {
    business_application_header: buildBusinessApplicationHeader({
      fromMember,
      toOrg: "RCS",
      messageDefinitionIdentifier: "camt.003.001.07",
      businessMessageIdentifier: messageId,
    }),
    get_account: {
      message_header: {
        message_identification: messageId,
        creation_date_time: creation,
      },
      account_query_definition: {
        account_criteria: { query_name: queryName },
      },
    },
  };
}

export function buildBalanceReportPayload(overrides = {}) {
  const creation = nowIso();
  const messageId = overrides.messageId || msgId("BAL");
  const fromMember = overrides.fromMember || "001";
  const queryName =
    overrides.queryName ||
    `${fromMember}_BalReport_${todayIso().replaceAll("-", "")}001`;

  return {
    business_application_header: buildBusinessApplicationHeader({
      fromMember,
      toOrg: "RCS",
      messageDefinitionIdentifier: "camt.003.001.07",
      businessMessageIdentifier: messageId,
    }),
    get_account: {
      message_header: {
        message_identification: messageId,
        creation_date_time: creation,
      },
      account_query_definition: {
        account_criteria: { query_name: queryName },
      },
    },
  };
}

/** Catalog of interactive scenarios covering the RTR sandbox Postman collection. */
export const SCENARIOS = [
  {
    id: "auth-token",
    group: "Authentication",
    title: "Generate OAuth Access Token",
    description:
      "Exchange your Consumer Key and Secret for a short-lived Bearer token (client_credentials).",
    iso: "OAuth 2.0",
    endpoint: "POST /accesstoken",
    method: "token",
    path: "/accesstoken",
    expectedOutcome: "Returns access_token (expires in ~5 minutes).",
    formFields: [],
  },
  {
    id: "send-payment",
    group: "Exchange Inbound",
    title: "Send Payment (pacs.008)",
    description:
      "Submit a Customer Credit Transfer to RTR Exchange. Expect pacs.002 status or admi.002 reject.",
    iso: "pacs.008.001.08 → pacs.002",
    endpoint: "POST /rtr-sandbox/payments",
    method: "payments",
    path: "/payments",
    expectedOutcome: "Payment Status Report (ACSP) or Message Reject.",
    formFields: [
      { key: "fromMember", label: "Instructing FI (member ID)", default: "111" },
      { key: "toMember", label: "Instructed FI (member ID)", default: "999" },
      { key: "amount", label: "Amount (CAD)", default: "100", type: "number" },
      { key: "debtorName", label: "Debtor name", default: "Mr. Zhang" },
      { key: "creditorName", label: "Creditor name", default: "Ms. Chloé" },
      {
        key: "debtorAccount",
        label: "Debtor account",
        default: "12345-123456",
      },
      {
        key: "creditorAccount",
        label: "Creditor account",
        default: "54321-654321",
      },
    ],
    buildPayload: (form) =>
      buildSendPaymentPayload({
        ...form,
        amount: Number(form.amount ?? 100),
      }),
  },
  {
    id: "send-payment-reject",
    group: "Exchange Inbound",
    title: "Send Payment — Syntax Reject Path",
    description:
      "Intentionally malformed pacs.008 to exercise admi.002 Message Reject handling.",
    iso: "pacs.008 → admi.002",
    endpoint: "POST /rtr-sandbox/payments",
    method: "payments",
    path: "/payments",
    expectedOutcome: "Message Reject (admi.002) or HTTP 400.",
    formFields: [],
    buildPayload: () => ({
      business_application_header: {
        from: {},
        to: {},
        business_message_identifier: "",
        message_definition_identifier: "pacs.008.001.08",
        creation_date: "not-a-date",
      },
      fi_to_fi_customer_credit_transfer: {
        group_header: {
          message_identification: "",
          number_of_transactions: "0",
        },
      },
    }),
  },
  {
    id: "payment-status",
    group: "Exchange Inbound",
    title: "Payment Status Enquiry (pacs.028)",
    description:
      "Ask Exchange for a Payment Status Report using instructing/instructed agents.",
    iso: "pacs.028.001.03 → pacs.002",
    endpoint: "POST /rtr-sandbox/payments/status",
    method: "payments-status",
    path: "/payments/status",
    expectedOutcome: "Payment Status Report (e.g. ACSP) or Message Reject.",
    formFields: [
      { key: "fromMember", label: "Instructing FI", default: "111" },
      { key: "toMember", label: "Instructed FI", default: "999" },
      {
        key: "originalMessageId",
        label: "Original message ID",
        default: "12345678900001",
      },
      {
        key: "originalEndToEndId",
        label: "Original end-to-end ID",
        default: "1234567890111",
      },
      {
        key: "originalUetr",
        label: "Original UETR",
        default: "eb6305c9-1f7f-49de-aed0-16487c27b41d",
      },
    ],
    buildPayload: (form) => buildPaymentStatusPayload(form),
  },
  {
    id: "heartbeat",
    group: "Exchange Inbound",
    title: "Inbound Heartbeat (admi.004)",
    description:
      "Application-level heartbeat from participant/CSP to RTR Exchange.",
    iso: "admi.004.001.02 → admi.011",
    endpoint: "POST /rtr-sandbox/inbound-heartbeat",
    method: "heartbeat",
    path: "/inbound-heartbeat",
    expectedOutcome: "System Event Acknowledgement (admi.011).",
    formFields: [
      { key: "fromMember", label: "Participant member ID", default: "111" },
      {
        key: "eventDescription",
        label: "Event description / ref",
        default: "1234567890001",
      },
    ],
    buildPayload: (form) => buildHeartbeatPayload(form),
  },
  {
    id: "interest-report",
    group: "Clearing & Settlement",
    title: "Interest Report (camt.003)",
    description:
      "Request interest report for the participant settlement account from RTR C&S.",
    iso: "camt.003.001.07 → camt.004",
    endpoint: "POST /rtr-sandbox/interest-report",
    method: "interest-report",
    path: "/interest-report",
    expectedOutcome: "Return Account with interest report (camt.004).",
    formFields: [
      { key: "fromMember", label: "Participant member ID", default: "001" },
      {
        key: "queryName",
        label: "Query name",
        default: "001_IntRep_20250506001",
      },
    ],
    buildPayload: (form) => buildInterestReportPayload(form),
  },
  {
    id: "balance-eod",
    group: "Clearing & Settlement",
    title: "Balance Report — End of Recon Cycle",
    description:
      "DSP balance report for end-of-reconciliation-cycle balances.",
    iso: "camt.003.001.07 → camt.004",
    endpoint: "POST /rtr-sandbox/payment-capacity-balance-report",
    method: "balance-report",
    path: "/payment-capacity-balance-report",
    expectedOutcome: "Return Account with end-of-cycle balances.",
    formFields: [
      { key: "fromMember", label: "Participant member ID", default: "001" },
      {
        key: "queryName",
        label: "Query name",
        default: "001_BalReport_20250506001",
      },
    ],
    buildPayload: (form) => buildBalanceReportPayload(form),
  },
  {
    id: "balance-current",
    group: "Clearing & Settlement",
    title: "Balance Report — Current Balance",
    description:
      "DSP / DSP-as-SA current payment-capacity balance report.",
    iso: "camt.003.001.07 → camt.004",
    endpoint: "POST /rtr-sandbox/payment-capacity-balance-report",
    method: "balance-report",
    path: "/payment-capacity-balance-report",
    expectedOutcome: "Return Account with current balances.",
    formFields: [
      { key: "fromMember", label: "Participant member ID", default: "002" },
      {
        key: "queryName",
        label: "Query name",
        default: "002_CurBalReport",
      },
    ],
    buildPayload: (form) => buildBalanceReportPayload(form),
  },
  {
    id: "e2e-payment-flow",
    group: "Guided Flows",
    title: "End-to-End: Send Payment → Status Enquiry",
    description:
      "Runs send payment, captures UETR / message IDs, then enquires status.",
    iso: "pacs.008 → pacs.028 → pacs.002",
    endpoint: "Multi-step",
    method: "e2e",
    path: null,
    expectedOutcome: "Linked payment + status responses in one run.",
    formFields: [
      { key: "fromMember", label: "Instructing FI", default: "111" },
      { key: "toMember", label: "Instructed FI", default: "999" },
      { key: "amount", label: "Amount (CAD)", default: "250", type: "number" },
      { key: "debtorName", label: "Debtor name", default: "Alex Rivera" },
      { key: "creditorName", label: "Creditor name", default: "Jordan Lee" },
    ],
  },
];

export function getScenarioCatalog() {
  return SCENARIOS.map(
    ({ buildPayload, ...publicFields }) => publicFields
  );
}

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id);
}
