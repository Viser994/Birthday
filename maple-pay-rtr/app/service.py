import asyncio
from typing import Any

from .config import Settings
from .ids import isoformat, new_message_id, new_payment_id, new_trace_id, new_uetr, utc_now
from .rtr import (
    FIELD_GUIDE,
    build_admi002,
    build_pacs002,
    build_pacs008,
    build_pacs028,
    infer_outcome,
    reject_for,
)
from .schemas import PaymentResponse
from .status import describe, is_final
from .store import PaymentStore


class PaymentService:
    def __init__(self, store: PaymentStore, settings: Settings) -> None:
        self.store = store
        self.settings = settings
        self._tasks: set[asyncio.Task] = set()

    def create(self, body: dict[str, Any], idempotency_key: str | None = None) -> dict[str, Any]:
        if idempotency_key:
            existing = self.store.get_by_idempotency(idempotency_key)
            if existing:
                return existing

        now = isoformat(utc_now())
        reference = body.get("reference") or new_message_id("E2E")[:35]
        payment = {
            "id": new_payment_id(),
            "amount": body["amount"],
            "currency": body["currency"],
            "payer": body["payer"],
            "payee": body["payee"],
            "reference": reference,
            "test_outcome": body.get("test_outcome"),
            "uetr": new_uetr(),
            "trace_id": new_trace_id(),
            "business_message_identifier": new_message_id("BIZ"),
            "message_identification": new_message_id("P8"),
            "rtr_status": "PDNG",
            "clearing_system_reference": None,
            "acceptance_date_time": None,
            "reject_reason": None,
            "created_at": now,
            "updated_at": now,
        }
        saved = self.store.create(payment, idempotency_key=idempotency_key)
        if saved["id"] != payment["id"]:
            return saved

        if self.settings.instant_settle:
            self.advance(saved["id"])
        else:
            self._schedule(saved["id"])
        return self.store.get(saved["id"]) or saved

    def _schedule(self, payment_id: str) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            self.advance(payment_id)
            return
        task = loop.create_task(self._settle_later(payment_id))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _settle_later(self, payment_id: str) -> None:
        delay = max(self.settings.settle_delay_seconds, 0)
        if delay:
            await asyncio.sleep(delay / 2)
            current = self.store.get(payment_id)
            if current and current["rtr_status"] == "PDNG" and infer_outcome(current) == "success":
                self._apply_status(payment_id, "ACSP")
            await asyncio.sleep(delay / 2)
        self.advance(payment_id)

    def advance(self, payment_id: str) -> dict[str, Any] | None:
        payment = self.store.get(payment_id)
        if not payment or is_final(payment["rtr_status"]):
            return payment
        outcome = infer_outcome(payment)
        if outcome == "pending":
            return payment
        if outcome == "rejected":
            return self._apply_status(payment_id, "RJCT", reject_reason=reject_for(payment))
        if payment["rtr_status"] == "PDNG":
            self._apply_status(payment_id, "ACSP")
        return self._apply_status(payment_id, "ACSC")

    def _apply_status(
        self,
        payment_id: str,
        rtr_status: str,
        reject_reason: dict[str, str] | None = None,
    ) -> dict[str, Any] | None:
        now = isoformat(utc_now())
        fields: dict[str, Any] = {"rtr_status": rtr_status, "updated_at": now}
        if rtr_status in {"ACSP", "ACSC"}:
            payment = self.store.get(payment_id) or {}
            fields["acceptance_date_time"] = payment.get("acceptance_date_time") or now
            fields["clearing_system_reference"] = (
                payment.get("clearing_system_reference") or new_message_id("RTR")
            )
        if reject_reason:
            fields["reject_reason"] = reject_reason
        return self.store.update(payment_id, **fields)

    def get(self, payment_id: str) -> dict[str, Any] | None:
        return self.store.get(payment_id)

    def list(self) -> list[dict[str, Any]]:
        return self.store.list()

    def status_check(self, payment_id: str) -> dict[str, Any] | None:
        payment = self.store.get(payment_id)
        if not payment:
            return None
        if not is_final(payment["rtr_status"]):
            payment = self.advance(payment_id) or payment
        return payment

    def to_response(self, payment: dict[str, Any]) -> PaymentResponse:
        info = describe(payment["rtr_status"])
        reject = payment.get("reject_reason")
        return PaymentResponse(
            id=payment["id"],
            status=info["api"],
            status_label=info["label"],
            status_meaning=info["meaning"],
            rtr_status=payment["rtr_status"],
            amount=payment["amount"],
            currency=payment["currency"],
            payer=payment["payer"],
            payee=payment["payee"],
            reference=payment["reference"],
            identifiers={
                "payment_id": payment["id"],
                "customer_reference": payment["reference"],
                "tracking_number": payment["uetr"],
                "rail_reference": payment.get("clearing_system_reference"),
                "message_id": payment["message_identification"],
                "trace_id": payment["trace_id"],
            },
            reject_reason=reject,
            created_at=payment["created_at"],
            updated_at=payment["updated_at"],
            next_step=info["next_step"].replace("{id}", payment["id"]),
        )

    def explain(self, payment: dict[str, Any]) -> dict[str, Any]:
        return {
            "payment": self.to_response(payment),
            "rtr_request": build_pacs008(payment, self.settings),
            "rtr_status_message": build_pacs002(payment, self.settings)
            if payment["rtr_status"] != "PDNG"
            else None,
            "rtr_reject_message": build_admi002(payment) if payment["rtr_status"] == "RJCT" else None,
            "status_enquiry": build_pacs028(payment, self.settings),
            "field_guide": FIELD_GUIDE,
        }
