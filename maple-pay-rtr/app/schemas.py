from decimal import Decimal, InvalidOperation
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Outcome = Literal["success", "rejected", "pending"]
ApiStatus = Literal["pending", "accepted", "completed", "rejected"]


class Party(BaseModel):
    name: str = Field(..., min_length=1, max_length=140, examples=["Jane Doe"])
    account: str = Field(..., min_length=1, max_length=34, examples=["WALLET-1001"])

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Name cannot be empty.")
        return cleaned

    @field_validator("account")
    @classmethod
    def clean_account(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Account may only contain letters, numbers, hyphens, and underscores.")
        return cleaned


class CreatePaymentRequest(BaseModel):
    amount: str = Field(..., examples=["25.00"], description="Canadian dollars, two decimal places.")
    currency: str = Field(default="CAD", examples=["CAD"])
    payer: Party
    payee: Party
    reference: str | None = Field(
        default=None,
        max_length=35,
        examples=["INV-1001"],
        description="Your own payment reference. We generate one if you skip this.",
    )
    test_outcome: Outcome | None = Field(
        default=None,
        description="Sandbox only. Force success, rejected, or pending.",
    )

    @field_validator("currency")
    @classmethod
    def cad_only(cls, value: str) -> str:
        currency = value.strip().upper()
        if currency != "CAD":
            raise ValueError("RTR sandbox payments must use CAD.")
        return currency

    @field_validator("reference")
    @classmethod
    def clean_reference(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("amount")
    @classmethod
    def normalize_amount(cls, value: Any) -> str:
        raw = str(value).strip().replace(",", "")
        try:
            number = Decimal(raw)
        except InvalidOperation as exc:
            raise ValueError("Amount must look like 25.00") from exc
        if number <= 0:
            raise ValueError("Amount must be greater than 0.00")
        if number.as_tuple().exponent < -2:
            raise ValueError("Amount can have at most 2 decimal places. Use 25.00 not 25.001")
        if number > Decimal("100000.00"):
            raise ValueError("Sandbox limit is 100000.00 CAD.")
        return f"{number.quantize(Decimal('0.01')):.2f}"

    @model_validator(mode="after")
    def distinct_accounts(self) -> "CreatePaymentRequest":
        if self.payer.account == self.payee.account:
            raise ValueError("Payer and payee accounts must be different.")
        return self


class Identifiers(BaseModel):
    payment_id: str
    customer_reference: str
    tracking_number: str
    rail_reference: str | None
    message_id: str
    trace_id: str


class RejectReason(BaseModel):
    code: str
    message: str


class PaymentResponse(BaseModel):
    id: str
    status: ApiStatus
    status_label: str
    status_meaning: str
    rtr_status: str
    amount: str
    currency: str
    payer: Party
    payee: Party
    reference: str
    identifiers: Identifiers
    reject_reason: RejectReason | None = None
    created_at: str
    updated_at: str
    next_step: str


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    count: int


class ErrorBody(BaseModel):
    code: str
    message: str
    hint: str | None = None
    fields: dict[str, str] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class HeartbeatResponse(BaseModel):
    ok: bool
    event_code: str
    event_description: str
    acknowledged: bool
    checked_at: str


class BalanceResponse(BaseModel):
    query_name: str
    account: str
    balance_type: str
    amount: str
    currency: str
    as_of: str


class RtrExplainResponse(BaseModel):
    payment: PaymentResponse
    rtr_request: dict[str, Any]
    rtr_status_message: dict[str, Any] | None
    rtr_reject_message: dict[str, Any] | None
    status_enquiry: dict[str, Any] | None = None
    field_guide: list[dict[str, str]]
