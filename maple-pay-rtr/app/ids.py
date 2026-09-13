import uuid
from datetime import datetime, timezone


def new_payment_id() -> str:
    return f"pay_{uuid.uuid4().hex[:16]}"


def new_uetr() -> str:
    return str(uuid.uuid4())


def new_message_id(prefix: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{prefix}{stamp}{uuid.uuid4().hex[:8]}".upper()


def new_trace_id() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def isoformat(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
