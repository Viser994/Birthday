from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ..auth import require_api_key
from ..config import get_settings
from ..ids import isoformat
from ..schemas import BalanceResponse, HeartbeatResponse

router = APIRouter(prefix="/v1", tags=["Operations"], dependencies=[Depends(require_api_key)])


@router.get("/health", response_model=HeartbeatResponse, summary="Rail heartbeat")
async def heartbeat() -> HeartbeatResponse:
    """Checks that the sandbox rail is reachable. Maps to admi.004 / admi.011."""
    now = isoformat(datetime.now(timezone.utc))
    return HeartbeatResponse(
        ok=True,
        event_code="HBRT",
        event_description="RTR sandbox heartbeat acknowledged.",
        acknowledged=True,
        checked_at=now,
    )


@router.get("/balance", response_model=BalanceResponse, summary="Sandbox settlement balance")
async def balance() -> BalanceResponse:
    """Sample C&S-style balance. Maps to camt.003 / camt.004."""
    settings = get_settings()
    return BalanceResponse(
        query_name="GETACCT",
        account=settings.member_id,
        balance_type="ITAV",
        amount="250000.00",
        currency="CAD",
        as_of=isoformat(datetime.now(timezone.utc)),
    )
