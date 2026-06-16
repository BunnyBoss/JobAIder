from functools import lru_cache
import os
from pathlib import Path

from pydantic import BaseModel


class Settings(BaseModel):
    model_name: str = os.getenv("MODEL_NAME", "gpt-4o-mini")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    db_path: str = os.getenv("JOBAIDER_DB_PATH", os.getenv("JOBRADAR_DB_PATH", "./jobaider.db"))
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")

    @property
    def resolved_db_path(self) -> Path:
        return Path(self.db_path).expanduser().resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()

