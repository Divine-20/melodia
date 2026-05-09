from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Melodia API"
    debug: bool = False

    database_url: str = (
        "postgresql+asyncpg://melodia_user:eTgyHxeRJlBw4Kw3yISwD4xUGdB0d1hv@"
        "dpg-d7vqmqb7uimc73f0fi0g-a.frankfurt-postgres.render.com/melodia"
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def use_asyncpg_driver(cls, v: object) -> object:
        """SQLAlchemy async engine requires postgresql+asyncpg:// (not plain postgresql://)."""
        if isinstance(v, str):
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    jwt_secret_key: str = "MELODIA@2026##"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
