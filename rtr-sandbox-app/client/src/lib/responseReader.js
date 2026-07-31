const TXN_STATUS = {
  ACSP: {
    label: "Accepted for settlement",
    tone: "success",
    detail: "The payment was accepted by RTR Exchange and is ready for settlement.",
  },
  ACSC: {
    label: "Settlement completed",
    tone: "success",
    detail: "Settlement of the payment has completed.",
  },
  ACCC: {
    label: "Accepted settlement completed on creditor account",
    tone: "success",
    detail: "Funds were accepted on the creditor side.",
  },
  ACTC: {
    label: "Accepted technical validation",
    tone: "success",
    detail: "Technical validation passed.",
  },
  PDNG: {
    label: "Pending",
    tone: "warn",
    detail: "The payment is still being processed.",
  },
  RJCT: {
    label: "Rejected",
    tone: "error",
    detail: "The payment was rejected.",
  },
  RCVD: {
    label: "Received",
    tone: "info",
    detail: "The payment instruction was received.",
  },
};

const BALANCE_TYPES = {
  STAB: "Settlement account balance",
  IAMT: "Interest amount",
  CURBAL: "Current balance",
  OPBD: "Opening booked balance",
  CLBD: "Closing booked balance",
  ITBD: "Interim booked balance",
};

const MSG_TITLES = {
  "pacs.002": "Payment status report",
  "pacs.008": "Customer credit transfer",
  "pacs.028": "Payment status enquiry",
  "admi.002": "Message rejected",
  "admi.004": "System event notification",
  "admi.011": "Heartbeat acknowledged",
  "camt.003": "Get account / report request",
  "camt.004": "Account report",
};

function dig(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function memberId(agent) {
  return (
    dig(agent, "financial_institution_identification.clearing_system_member_identification.member_identification") ||
    dig(agent, "financial_institution_identification.financial_institution_identification.clearing_system_member_identification.member_identification") ||
    null
  );
}

function orgId(party) {
  return (
    dig(party, "organisation_identification.identification.organisation_identification.other.identification") ||
    dig(party, "organisation_identification.other.identification") ||
    null
  );
}

function msgFamily(messageDef) {
  if (!messageDef) return null;
  return String(messageDef).split(".").slice(0, 2).join(".");
}

function money(amount, currency = "CAD") {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currency}`;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
  }).format(n);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function field(label, value, opts = {}) {
  if (value == null || value === "") return null;
  return { label, value: String(value), mono: Boolean(opts.mono), copy: Boolean(opts.copy) };
}

function summarizeBah(bah = {}) {
  const fromMember = memberId(bah.from) || orgId(bah.from);
  const toMember = memberId(bah.to) || orgId(bah.to);
  const family = msgFamily(bah.message_definition_identifier);
  return {
    messageType: bah.message_definition_identifier || "Unknown",
    messageTitle: MSG_TITLES[family] || "ISO 20022 response",
    fields: [
      field("From", fromMember, { mono: true }),
      field("To", toMember, { mono: true }),
      field("Business message ID", bah.business_message_identifier, {
        mono: true,
        copy: true,
      }),
      field("Created", formatDate(bah.creation_date)),
    ].filter(Boolean),
  };
}

function summarizePaymentStatus(data) {
  const bah = summarizeBah(data.business_application_header);
  const tx =
    data.fi_to_fi_payment_status_report?.transaction_information_and_status ||
    {};
  const statusCode = tx.transaction_status || "UNKNOWN";
  const statusMeta = TXN_STATUS[statusCode] || {
    label: statusCode,
    tone: "info",
    detail: "Payment status returned by RTR Exchange.",
  };
  const reason =
    dig(tx, "status_reason_information.reason.code") ||
    dig(tx, "status_reason_information.additional_information");

  return {
    kind: "payment-status",
    headline: statusMeta.label,
    subtitle: bah.messageTitle,
    tone: statusMeta.tone,
    summary: statusMeta.detail,
    badges: [
      { text: statusCode, tone: statusMeta.tone },
      { text: bah.messageType, tone: "neutral" },
    ],
    highlights: [
      field("UETR", tx.original_uetr, { mono: true, copy: true }),
      field("End-to-end ID", tx.original_end_to_end_identification, {
        mono: true,
        copy: true,
      }),
      field(
        "Original message ID",
        dig(tx, "original_group_information.original_message_identification"),
        { mono: true, copy: true }
      ),
      field("Clearing reference", tx.clearing_system_reference, {
        mono: true,
        copy: true,
      }),
      field("Accepted at", formatDate(tx.acceptance_date_time)),
      field("Instructing FI", memberId(tx.instructing_agent), { mono: true }),
      field("Instructed FI", memberId(tx.instructed_agent), { mono: true }),
      field("Reason", reason),
    ].filter(Boolean),
    sections: [
      {
        title: "Message header",
        fields: bah.fields,
      },
    ],
  };
}

function summarizeReject(data) {
  const bah = summarizeBah(data.business_application_header);
  const reject = data.message_reject || {};
  const code =
    dig(reject, "reason.rejecting_party_reason") ||
    dig(reject, "reason.rejection_code") ||
    "REJECT";
  const description =
    dig(reject, "reason.reason_description") ||
    dig(reject, "reason.rejection_reason") ||
    "Message failed validation.";

  return {
    kind: "reject",
    headline: "Message rejected",
    subtitle: bah.messageTitle,
    tone: "error",
    summary: description,
    badges: [
      { text: code, tone: "error" },
      { text: bah.messageType, tone: "neutral" },
    ],
    highlights: [
      field(
        "Related reference",
        dig(reject, "related_reference.reference") || reject.related_reference,
        { mono: true }
      ),
      field("Reject code", code, { mono: true }),
    ].filter(Boolean),
    sections: [
      {
        title: "What failed",
        fields: [field("Details", description)].filter(Boolean),
      },
      { title: "Message header", fields: bah.fields },
    ],
  };
}

function summarizeHeartbeat(data) {
  const bah = summarizeBah(data.business_application_header);
  const ack = data.system_event_acknowledgement || {};
  const eventCode =
    dig(ack, "acknowledgement_details.event_code") ||
    dig(ack, "event_information.event_code") ||
    "HBRT";
  const eventDescription =
    dig(ack, "acknowledgement_details.event_description") ||
    dig(ack, "event_information.event_description");

  return {
    kind: "heartbeat",
    headline: "Exchange is reachable",
    subtitle: bah.messageTitle,
    tone: "success",
    summary: "RTR Exchange acknowledged the heartbeat (admi.011).",
    badges: [
      { text: eventCode, tone: "success" },
      { text: bah.messageType, tone: "neutral" },
    ],
    highlights: [
      field("Event code", eventCode, { mono: true }),
      field("Event reference", eventDescription, { mono: true, copy: true }),
      field("Ack message ID", ack.message_identification, {
        mono: true,
        copy: true,
      }),
    ].filter(Boolean),
    sections: [{ title: "Message header", fields: bah.fields }],
  };
}

function summarizeAccountReport(data) {
  const bah = summarizeBah(data.business_application_header);
  const returnAccount = data.return_account || {};
  const reports = asArray(dig(returnAccount, "report_or_error.account_report"));
  const first = reports[0] || {};
  const account = dig(first, "account_or_error.account") || {};
  const balances = asArray(account.multilateral_balance || account.balances);

  const balanceRows = balances.map((b) => {
    const typeCode =
      dig(b, "type.proprietary") ||
      dig(b, "type.code_or_proprietary.proprietary") ||
      dig(b, "type.code_or_proprietary.code") ||
      "BAL";
    return {
      type: typeCode,
      typeLabel: BALANCE_TYPES[typeCode] || typeCode,
      amount: money(b.amount?.amount ?? b.amount, account.currency || b.amount?.currency || "CAD"),
      direction:
        b.credit_debit_indicator === "DBIT"
          ? "Debit"
          : b.credit_debit_indicator === "CRDT"
            ? "Credit"
            : b.credit_debit_indicator || "—",
      rate:
        dig(b, "restriction_type.description") ||
        dig(b, "restriction_type.type.identification") ||
        null,
      asOf: formatDate(
        dig(b, "value_date.date_time") || dig(b, "date.date") || dig(b, "date.date_time")
      ),
    };
  });

  const interest = balanceRows.find((b) => b.type === "IAMT");
  const headline = interest
    ? `Interest earned: ${interest.amount}`
    : balanceRows[0]
      ? `${balanceRows[0].typeLabel}: ${balanceRows[0].amount}`
      : "Account report received";

  return {
    kind: "account-report",
    headline,
    subtitle: account.name
      ? `${account.name} · ${bah.messageTitle}`
      : bah.messageTitle,
    tone: "success",
    summary: dig(returnAccount, "message_header.query_name")
      ? `Query ${dig(returnAccount, "message_header.query_name")} returned ${balanceRows.length} balance line(s).`
      : "Clearing & Settlement returned an account report.",
    badges: [
      { text: account.currency || "CAD", tone: "info" },
      { text: bah.messageType, tone: "neutral" },
    ],
    highlights: [
      field("Institution", account.name),
      field(
        "Account ID",
        dig(first, "account_identification.other.identification"),
        { mono: true }
      ),
      field("Query name", dig(returnAccount, "message_header.query_name"), {
        mono: true,
      }),
      field(
        "Original query ID",
        dig(returnAccount, "message_header.original_business_query.message_identification"),
        { mono: true, copy: true }
      ),
    ].filter(Boolean),
    tables: balanceRows.length
      ? [
          {
            title: "Balances",
            columns: ["Type", "Amount", "Direction", "Rate / note", "As of"],
            rows: balanceRows.map((b) => [
              b.typeLabel,
              b.amount,
              b.direction,
              b.rate || "—",
              b.asOf,
            ]),
          },
        ]
      : [],
    sections: [{ title: "Message header", fields: bah.fields }],
  };
}

function summarizeToken(data) {
  const expiresSec = Number(data.expires_in || 0);
  const products =
    data.api_product_list_json ||
    (data.api_product_list
      ? [String(data.api_product_list).replace(/^\[|\]$/g, "")]
      : []);

  return {
    kind: "token",
    headline: "Access token issued",
    subtitle: "OAuth 2.0 client credentials",
    tone: "success",
    summary: `Bearer token is valid for about ${Math.round(expiresSec / 60)} minutes.`,
    badges: [
      { text: data.token_type || "Bearer", tone: "success" },
      { text: products[0] || "unknown product", tone: "info" },
    ],
    highlights: [
      field("Product", products.join(", ") || "—", { mono: true }),
      field("Expires in", `${expiresSec} seconds`),
      field("Developer", data["developer.email"]),
      field("Application", data.application_name, { mono: true }),
      field("Client ID", data.client_id, { mono: true }),
      field("Access token", data.access_token, { mono: true, copy: true }),
      field("Status", data.status),
    ].filter(Boolean),
    sections: [],
  };
}

function summarizeRequestPayment(body) {
  const tx =
    body.fi_to_fi_customer_credit_transfer?.credit_transfer_transaction_information ||
    {};
  const amount = dig(tx, "interbank_settlement_amount.amount");
  const currency = dig(tx, "interbank_settlement_amount.currency") || "CAD";
  return {
    kind: "request-payment",
    headline: `Send ${money(amount, currency)}`,
    subtitle: "Customer credit transfer (pacs.008)",
    tone: "info",
    summary: `${dig(tx, "debtor.name") || "Debtor"} → ${dig(tx, "creditor.name") || "Creditor"}`,
    badges: [{ text: "pacs.008", tone: "neutral" }],
    highlights: [
      field("Amount", money(amount, currency)),
      field("Debtor", dig(tx, "debtor.name")),
      field("Creditor", dig(tx, "creditor.name")),
      field("Debtor account", dig(tx, "debtor_account.identification.other.identification"), {
        mono: true,
      }),
      field(
        "Creditor account",
        dig(tx, "creditor_account.identification.other.identification"),
        { mono: true }
      ),
      field("UETR", dig(tx, "payment_identification.uetr"), {
        mono: true,
        copy: true,
      }),
      field(
        "End-to-end ID",
        dig(tx, "payment_identification.end_to_end_identification"),
        { mono: true, copy: true }
      ),
      field("Instructing FI", memberId(tx.instructing_agent), { mono: true }),
      field("Instructed FI", memberId(tx.instructed_agent), { mono: true }),
    ].filter(Boolean),
    sections: [],
  };
}

function summarizeGenericIso(data) {
  const bah = summarizeBah(data.business_application_header || {});
  return {
    kind: "generic",
    headline: bah.messageTitle,
    subtitle: bah.messageType,
    tone: "info",
    summary: "Parsed ISO 20022 response. Expand raw JSON for full detail.",
    badges: [{ text: bah.messageType, tone: "neutral" }],
    highlights: bah.fields,
    sections: [],
  };
}

function summarizeHttpError(data, status) {
  const message =
    data?.message ||
    data?.error ||
    dig(data, "fault.faultstring") ||
    "The API returned an error.";
  return {
    kind: "http-error",
    headline: `Request failed (${status || "error"})`,
    subtitle: data?.code || "API error",
    tone: "error",
    summary: String(message),
    badges: [
      { text: String(status || "ERR"), tone: "error" },
      data?.code ? { text: data.code, tone: "error" } : null,
    ].filter(Boolean),
    highlights: [
      field("Error code", data?.code, { mono: true }),
      field("Message", message),
    ].filter(Boolean),
    sections: [],
  };
}

function summarizeEmpty(status) {
  return {
    kind: "empty",
    headline: status === 200 ? "Empty response body" : "No response body",
    subtitle: `HTTP ${status ?? "—"}`,
    tone: status && status >= 400 ? "error" : "warn",
    summary:
      "The API returned success with an empty JSON object. This can happen for some sandbox stub responses.",
    badges: [{ text: `HTTP ${status ?? "—"}`, tone: "warn" }],
    highlights: [],
    sections: [],
  };
}

export function readApiPayload(data, { status, isRequest = false } = {}) {
  if (data == null) {
    return summarizeEmpty(status);
  }

  if (typeof data !== "object") {
    return {
      kind: "text",
      headline: "Response",
      subtitle: "",
      tone: status && status >= 400 ? "error" : "info",
      summary: String(data),
      badges: [],
      highlights: [],
      sections: [],
    };
  }

  if (Object.keys(data).length === 0) {
    return summarizeEmpty(status);
  }

  if (data.access_token || data.token_type === "Bearer") {
    return summarizeToken(data);
  }

  if (data.message || data.fault || data.code === "invalid_token") {
    if (!data.business_application_header) {
      return summarizeHttpError(data, status);
    }
  }

  if (isRequest && data.fi_to_fi_customer_credit_transfer) {
    return summarizeRequestPayment(data);
  }

  if (data.fi_to_fi_payment_status_report) {
    return summarizePaymentStatus(data);
  }

  if (data.message_reject) {
    return summarizeReject(data);
  }

  if (data.system_event_acknowledgement || data.system_event_notification) {
    if (data.system_event_acknowledgement) return summarizeHeartbeat(data);
    const bah = summarizeBah(data.business_application_header);
    return {
      kind: "heartbeat-request",
      headline: "Heartbeat request",
      subtitle: bah.messageTitle,
      tone: "info",
      summary: "Sending application-level heartbeat to RTR Exchange.",
      badges: [{ text: "admi.004", tone: "neutral" }],
      highlights: [
        field(
          "Event code",
          dig(data, "system_event_notification.event_information.event_code"),
          { mono: true }
        ),
        field(
          "Event description",
          dig(
            data,
            "system_event_notification.event_information.event_description"
          ),
          { mono: true }
        ),
        ...bah.fields,
      ].filter(Boolean),
      sections: [],
    };
  }

  if (data.return_account || data.get_account) {
    if (data.return_account) return summarizeAccountReport(data);
    const bah = summarizeBah(data.business_application_header);
    return {
      kind: "report-request",
      headline: "Account report request",
      subtitle: bah.messageTitle,
      tone: "info",
      summary: "Requesting Clearing & Settlement account information.",
      badges: [{ text: "camt.003", tone: "neutral" }],
      highlights: [
        field(
          "Query name",
          dig(data, "get_account.account_query_definition.account_criteria.query_name"),
          { mono: true }
        ),
        ...bah.fields,
      ].filter(Boolean),
      sections: [],
    };
  }

  if (data.business_application_header) {
    return summarizeGenericIso(data);
  }

  if (status && status >= 400) {
    return summarizeHttpError(data, status);
  }

  return {
    kind: "unknown",
    headline: "API response",
    subtitle: "",
    tone: "info",
    summary: "Unrecognized payload shape. See raw JSON below.",
    badges: [],
    highlights: Object.entries(data)
      .slice(0, 8)
      .map(([k, v]) =>
        field(k, typeof v === "object" ? JSON.stringify(v) : v, { mono: true })
      )
      .filter(Boolean),
    sections: [],
  };
}

export function readStep(step) {
  const result = step?.result || {};
  const requestBody = step?.requestBody ?? result?.request?.body ?? null;
  const responseData = result?.data ?? null;

  return {
    requestView: requestBody
      ? readApiPayload(requestBody, { isRequest: true })
      : null,
    responseView: readApiPayload(responseData, {
      status: result?.status,
      isRequest: false,
    }),
    httpOk: result?.ok !== false && (result?.status ?? 200) < 400,
    status: result?.status,
    mode: result?.mode,
  };
}
