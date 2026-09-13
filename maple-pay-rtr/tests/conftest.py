import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.deps import get_service
from app.main import app
from app.service import PaymentService
from app.store import PaymentStore

API_KEY = "maple_sandbox_dev_key"


@pytest.fixture
def service() -> PaymentService:
    settings = Settings(instant_settle=True, database_path=":memory:")
    return PaymentService(PaymentStore(":memory:"), settings)


@pytest.fixture
def client(service: PaymentService) -> TestClient:
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"X-API-Key": API_KEY, "Content-Type": "application/json"}


@pytest.fixture
def sample_payment() -> dict:
    return {
        "amount": "25.00",
        "payer": {"name": "Jane Doe", "account": "WALLET-1001"},
        "payee": {"name": "Acme Store", "account": "WALLET-2002"},
        "reference": "INV-1001",
    }
