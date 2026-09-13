from datetime import datetime, timezone
from typing import Any

from .config import Settings
from .ids import isoformat, new_message_id


def _member(member_id: str) -> dict[str, Any]:
    return {
        "financial_institution_identification": {
            "clearing_system_member_identification": {
                "member_identification": member_id
            }
        }
    }


def build_pacs008(payment: dict[str, Any], settings: Settings) -> dict[str, Any]:
    created = payment["created_at"]
    settlement_date = created[:10]
    return {
        "app_header": {
            "from": {"member_identification": settings.member_id},
            "to": {"identification": settings.rtr_member_id},
            "business_message_identifier": payment["business_message_identifier"],
            "message_definition_identifier": "pacs.008.001.08",
            "creation_date": created,
        },
        "http_headers": {
            "x-uetr": payment["uetr"],
            "traceability-id": payment["trace_id"],
            "x-jws-signature": "sandbox-signature-not-required-for-integrators",
        },
        "document": {
            "fi_to_fi_customer_credit_transfer": {
                "group_header": {
                    "message_identification": payment["message_identification"],
                    "creation_date_time": created,
                    "number_of_transactions": "1",
                    "settlement_information": {
                        "settlement_method": settings.settlement_method,
                        "clearing_system": {"code": settings.clearing_system},
                    },
                },
                "credit_transfer_transaction_information": {
                    "payment_identification": {
                        "end_to_end_identification": payment["reference"],
                        "uetr": payment["uetr"],
                    },
                    "payment_type_information": {
                        "local_instrument": {"proprietary": settings.local_instrument}
                    },
                    "interbank_settlement_amount": {
                        "amount": payment["amount"],
                        "currency": payment["currency"],
                    },
                    "interbank_settlement_date": settlement_date,
                    "charge_bearer": settings.charge_bearer,
                    "instructing_agent": _member(settings.member_id),
                    "instructed_agent": _member(settings.rtr_member_id),
                    "debtor": {"name": payment["payer"]["name"]},
                    "debtor_account": {
                        "identification": {
                            "other": {"identification": payment["payer"]["account"]}
                        }
                    },
                    "debtor_agent": _member(settings.member_id),
                    "creditor": {"name": payment["payee"]["name"]},
                    "creditor_account": {
                        "identification": {
                            "other": {"identification": payment["payee"]["account"]}
                        }
                    },
                    "creditor_agent": _member(settings.rtr_member_id),
                },
            }
        },
    }


def build_pacs002(payment: dict[str, Any], settings: Settings) -> dict[str, Any]:
    now = isoformat(datetime.now(timezone.utc))
    return {
        "app_header": {
            "from": {"member_identification": settings.rtr_member_id},
            "to": {"identification": settings.member_id},
            "business_message_identifier": new_message_id("STS"),
            "message_definition_identifier": "pacs.002.001.10",
            "creation_date": now,
        },
        "document": {
            "fi_to_fi_payment_status_report": {
                "group_header": {"message_identification": new_message_id("P2")},
                "original_group_information_and_status": {
                    "original_message_identification": payment["message_identification"],
                    "original_message_name_identification": "pacs.008.001.08",
                },
                "transaction_information_and_status": {
                    "original_end_to_end_identification": payment["reference"],
                    "original_uetr": payment["uetr"],
                    "transaction_status": payment["rtr_status"],
                    "acceptance_date_time": payment.get("acceptance_date_time") or now,
                    "clearing_system_reference": payment.get("clearing_system_reference"),
                    "instructing_agent": _member(settings.rtr_member_id),
                    "instructed_agent": _member(settings.member_id),
                },
            }
        },
    }


def build_pacs028(payment: dict[str, Any], settings: Settings) -> dict[str, Any]:
    now = isoformat(datetime.now(timezone.utc))
    return {
        "app_header": {
            "from": {"member_identification": settings.member_id},
            "to": {"identification": settings.rtr_member_id},
            "business_message_identifier": new_message_id("ENQ"),
            "message_definition_identifier": "pacs.028.001.03",
            "creation_date": now,
        },
        "document": {
            "fi_to_fi_payment_status_request": {
                "group_header": {
                    "message_identification": new_message_id("P28"),
                    "creation_date_time": now,
                },
                "transaction_information": {
                    "original_message_identification": payment["message_identification"],
                    "original_message_name_identification": "pacs.008.001.08",
                    "original_end_to_end_identification": payment["reference"],
                    "original_uetr": payment["uetr"],
                },
            }
        },
    }


def build_admi002(payment: dict[str, Any]) -> dict[str, Any]:
    reason = payment.get("reject_reason") or {}
    return {
        "document": {
            "message_reject": {
                "related_reference": {"reference": payment["message_identification"]},
                "rejecting_party_reason": reason.get("code", "NARR"),
                "reason_description": reason.get("message", "Payment rejected"),
            }
        }
    }


def infer_outcome(payment: dict[str, Any]) -> str:
    if payment.get("test_outcome"):
        return payment["test_outcome"]
    account = payment["payee"]["account"].upper()
    if account.startswith("REJECT") or account.endswith("-RJCT"):
        return "rejected"
    if account.startswith("PENDING") or account.endswith("-PDNG"):
        return "pending"
    return "success"


def reject_for(payment: dict[str, Any]) -> dict[str, str]:
    account = payment["payee"]["account"].upper()
    if account.startswith("REJECT") or account.endswith("-RJCT"):
        return {
            "code": "AC01",
            "message": "The payee account is not valid for RTR. Use a normal account such as WALLET-2002.",
        }
    return {
        "code": "NARR",
        "message": "Sandbox rejected this payment because test_outcome was set to rejected.",
    }


FIELD_GUIDE = [
    {
        "you_send": "amount",
        "we_send_to_rtr": "interbank_settlement_amount.amount",
        "why": "How much CAD to move.",
    },
    {
        "you_send": "currency",
        "we_send_to_rtr": "interbank_settlement_amount.currency",
        "why": "RTR sandbox is CAD only.",
    },
    {
        "you_send": "payer.name",
        "we_send_to_rtr": "debtor.name",
        "why": "Who is sending the money.",
    },
    {
        "you_send": "payer.account",
        "we_send_to_rtr": "debtor_account.identification",
        "why": "The sender wallet or account number.",
    },
    {
        "you_send": "payee.name",
        "we_send_to_rtr": "creditor.name",
        "why": "Who should receive the money.",
    },
    {
        "you_send": "payee.account",
        "we_send_to_rtr": "creditor_account.identification",
        "why": "The receiver wallet or account number.",
    },
    {
        "you_send": "reference",
        "we_send_to_rtr": "end_to_end_identification",
        "why": "Your invoice or order number so you can match it later.",
    },
    {
        "you_send": "(generated)",
        "we_send_to_rtr": "uetr / x-uetr",
        "why": "Universal tracking number for the payment lifecycle.",
    },
    {
        "you_send": "(generated)",
        "we_send_to_rtr": "traceability-id",
        "why": "Technical trace for support. You do not need to send this.",
    },
]
