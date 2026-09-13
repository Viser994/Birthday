from pathlib import Path

STATUS_BY_RTR = {
    "PDNG": {
        "api": "pending",
        "label": "Pending",
        "meaning": "The payment has been created and is still being processed.",
        "next_step": "Call GET /v1/payments/{id} again in a second or two.",
    },
    "ACSP": {
        "api": "accepted",
        "label": "Accepted for settlement",
        "meaning": "Payments Canada accepted the payment and settlement is in progress.",
        "next_step": "Call GET /v1/payments/{id} until status is completed or rejected.",
    },
    "ACSC": {
        "api": "completed",
        "label": "Completed",
        "meaning": "Settlement finished. The payee should have the funds.",
        "next_step": "No further action needed.",
    },
    "RJCT": {
        "api": "rejected",
        "label": "Rejected",
        "meaning": "The payment was rejected and no funds moved.",
        "next_step": "Read reject_reason, fix the request, and send a new payment.",
    },
}

API_TO_RTR = {item["api"]: code for code, item in STATUS_BY_RTR.items()}


def describe(rtr_status: str) -> dict:
    return STATUS_BY_RTR.get(rtr_status, STATUS_BY_RTR["PDNG"])


def is_final(rtr_status: str) -> bool:
    return rtr_status in {"ACSC", "RJCT"}


def dictionary_path() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "status_codes.json"
