from functools import lru_cache

from .config import Settings, get_settings
from .service import PaymentService
from .store import PaymentStore


@lru_cache
def get_store() -> PaymentStore:
    return PaymentStore(get_settings().database_path)


@lru_cache
def get_service() -> PaymentService:
    settings: Settings = get_settings()
    return PaymentService(get_store(), settings)
