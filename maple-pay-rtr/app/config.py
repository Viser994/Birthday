from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MAPLE_", extra="ignore")

    app_name: str = "Maple Pay RTR"
    api_key: str = "maple_sandbox_dev_key"
    member_id: str = "MPAYCA01"
    rtr_member_id: str = "PAYCAN01"
    clearing_system: str = "RTR"
    local_instrument: str = "RTREXCHANGE"
    settlement_method: str = "CLRG"
    charge_bearer: str = "SLEV"
    default_currency: str = "CAD"
    sandbox_max_amount: str = "100000.00"
    database_path: str = "maple_pay_rtr.db"
    settle_delay_seconds: float = 1.2
    instant_settle: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
