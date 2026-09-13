import asyncio

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from ..auth import require_api_key
from ..deps import get_service
from ..schemas import CreatePaymentRequest, PaymentListResponse, PaymentResponse, RtrExplainResponse
from ..service import PaymentService
from ..status import is_final

router = APIRouter(prefix="/v1/payments", tags=["Payments"], dependencies=[Depends(require_api_key)])


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a payment",
    description="Send CAD from one account to another. You only need amount, payer, and payee.",
)
async def create_payment(
    body: CreatePaymentRequest,
    service: PaymentService = Depends(get_service),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    wait_for_result: bool = Query(
        default=False,
        description="If true, wait a few seconds so the first response is usually completed or rejected.",
    ),
) -> PaymentResponse:
    payment = service.create(body.model_dump(), idempotency_key=idempotency_key)
    if wait_for_result:
        payment = await _wait_for_final(service, payment["id"])
    return service.to_response(payment)


@router.get("", response_model=PaymentListResponse, summary="List payments")
async def list_payments(service: PaymentService = Depends(get_service)) -> PaymentListResponse:
    payments = [service.to_response(item) for item in service.list()]
    return PaymentListResponse(payments=payments, count=len(payments))


@router.get("/{payment_id}", response_model=PaymentResponse, summary="Get a payment")
async def get_payment(
    payment_id: str,
    service: PaymentService = Depends(get_service),
) -> PaymentResponse:
    payment = service.get(payment_id)
    if not payment:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"No payment with id {payment_id}.",
                "hint": "Use the id returned by POST /v1/payments.",
            },
        )
    return service.to_response(payment)


@router.post(
    "/{payment_id}/status-check",
    response_model=PaymentResponse,
    summary="Ask RTR for the latest status",
)
async def status_check(
    payment_id: str,
    service: PaymentService = Depends(get_service),
) -> PaymentResponse:
    payment = service.status_check(payment_id)
    if not payment:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"No payment with id {payment_id}.",
                "hint": "Use the id returned by POST /v1/payments.",
            },
        )
    return service.to_response(payment)


@router.get(
    "/{payment_id}/rtr",
    response_model=RtrExplainResponse,
    summary="See the Payments Canada / ISO 20022 messages we generated",
)
async def explain_payment(
    payment_id: str,
    service: PaymentService = Depends(get_service),
) -> dict:
    payment = service.get(payment_id)
    if not payment:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"No payment with id {payment_id}.",
                "hint": "Use the id returned by POST /v1/payments.",
            },
        )
    return service.explain(payment)


async def _wait_for_final(service: PaymentService, payment_id: str, timeout: float = 5.0) -> dict:
    deadline = asyncio.get_event_loop().time() + timeout
    payment = service.get(payment_id)
    while payment and not is_final(payment["rtr_status"]):
        if asyncio.get_event_loop().time() >= deadline:
            break
        await asyncio.sleep(0.15)
        payment = service.get(payment_id)
    return payment or service.get(payment_id)
