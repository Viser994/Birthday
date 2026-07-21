import { randomUUID } from "crypto";

function nowIso() {
  return new Date().toISOString();
}

function bah({ fromMember = "RTR", toMember = "111", msgDef, msgId }) {
  return {
    from: {
      organisation_identification: {
        identification: {
          organisation_identification: {
            other: { identification: fromMember },
          },
        },
      },
    },
    to: {
      financial_institution_identification: {
        financial_institution_identification: {
          clearing_system_member_identification: {
            member_identification: toMember,
          },
        },
      },
    },
    business_message_identifier: msgId,
    message_definition_identifier: msgDef,
    creation_date: nowIso(),
  };
}

export function demoToken() {
  return {
    access_token: `demo-${randomUUID()}`,
    token_type: "Bearer",
    expires_in: 299,
    issued_at: String(Date.now()),
    scope: "client_credentials",
    demo: true,
  };
}

export function demoPaymentStatus(requestBody = {}, status = "ACSP") {
  const uetr =
    requestBody?.fi_to_fi_customer_credit_transfer
      ?.credit_transfer_transaction_information?.payment_identification
      ?.uetr ||
    requestBody?.fi_to_fi_payment_status_request?.transaction_information
      ?.original_uetr ||
    randomUUID();
  const originalMsg =
    requestBody?.fi_to_fi_customer_credit_transfer?.group_header
      ?.message_identification ||
    requestBody?.fi_to_fi_payment_status_request?.transaction_information
      ?.original_group_information?.original_message_identification ||
    "12345678900001";
  const endToEnd =
    requestBody?.fi_to_fi_customer_credit_transfer
      ?.credit_transfer_transaction_information?.payment_identification
      ?.end_to_end_identification ||
    requestBody?.fi_to_fi_payment_status_request?.transaction_information
      ?.original_end_to_end_identification ||
    "1234567890111";
  const msgId = `DEMO${Date.now().toString().slice(-10)}`;

  return {
    business_application_header: bah({
      fromMember: "RTR",
      toMember: "111",
      msgDef: "pacs.002.001.10",
      msgId,
    }),
    fi_to_fi_payment_status_report: {
      group_header: {
        message_identification: msgId,
        creation_date_time: nowIso(),
      },
      transaction_information_and_status: {
        original_group_information: {
          original_message_identification: originalMsg,
          original_message_name_identification: "pacs.008.001.08",
        },
        original_end_to_end_identification: endToEnd,
        original_uetr: uetr,
        transaction_status: status,
        status_reason_information:
          status === "ACSP"
            ? undefined
            : {
                reason: { code: "FF01" },
                additional_information: "Demo reject scenario",
              },
      },
    },
    demo: true,
  };
}

export function demoMessageReject(detail = "Syntax validation failure (demo)") {
  const msgId = `REJ${Date.now().toString().slice(-10)}`;
  return {
    business_application_header: bah({
      fromMember: "RTR",
      toMember: "111",
      msgDef: "admi.002.001.01",
      msgId,
    }),
    message_reject: {
      related_reference: "INVALID",
      reason: {
        rejection_code: "FF01",
        rejection_reason: detail,
      },
    },
    demo: true,
  };
}

export function demoHeartbeatAck(requestBody = {}) {
  const msgId = `ACK${Date.now().toString().slice(-10)}`;
  return {
    business_application_header: bah({
      fromMember: "RTR",
      toMember:
        requestBody?.business_application_header?.from
          ?.financial_institution_identification
          ?.financial_institution_identification
          ?.clearing_system_member_identification?.member_identification ||
        "111",
      msgDef: "admi.011.001.01",
      msgId,
    }),
    system_event_acknowledgement: {
      event_information: {
        event_code: "HBRT",
        event_description:
          requestBody?.system_event_notification?.event_information
            ?.event_description || "Heartbeat acknowledged",
      },
    },
    demo: true,
  };
}

export function demoAccountReport(kind = "interest", requestBody = {}) {
  const msgId = `ACC${Date.now().toString().slice(-10)}`;
  const queryName =
    requestBody?.get_account?.account_query_definition?.account_criteria
      ?.query_name || "demo_query";
  const member =
    requestBody?.business_application_header?.from
      ?.financial_institution_identification?.financial_institution_identification
      ?.clearing_system_member_identification?.member_identification || "001";

  return {
    business_application_header: bah({
      fromMember: "RCS",
      toMember: member,
      msgDef: "camt.004.001.08",
      msgId,
    }),
    return_account: {
      message_header: {
        message_identification: msgId,
        creation_date_time: nowIso(),
        original_business_query: {
          message_identification:
            requestBody?.get_account?.message_header?.message_identification ||
            msgId,
        },
      },
      report_or_error: {
        account_report: {
          account_identification: {
            other: { identification: `${member}-SETTLEMENT` },
          },
          account_or_error: {
            account: {
              currency: "CAD",
              name: kind === "interest" ? "Interest Report" : "Balance Report",
              proprietary_account_type: {
                identification: kind === "interest" ? "INT" : "BAL",
              },
            },
          },
          balances: [
            {
              type: {
                code_or_proprietary: {
                  proprietary: kind === "interest" ? "INTAMT" : "CURBAL",
                },
              },
              amount: {
                currency: "CAD",
                amount: kind === "interest" ? 12.45 : 1_250_000.0,
              },
              credit_debit_indicator: "CRDT",
              date: { date: nowIso().slice(0, 10) },
            },
          ],
          additional_account_information: queryName,
        },
      },
    },
    demo: true,
  };
}
