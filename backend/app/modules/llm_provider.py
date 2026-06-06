from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import get_settings


def _stored_provider_settings() -> dict[str, str]:
    try:
        from app.db import get_db

        with get_db() as conn:
            rows = conn.execute(
                "SELECT key, value FROM settings WHERE key IN ('model_name', 'openai_api_key', 'openai_base_url')"
            ).fetchall()
        return {row["key"]: row["value"] for row in rows}
    except Exception:
        return {}


class LLMProvider:
    def __init__(
        self,
        model_name: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> None:
        settings = get_settings()
        stored = _stored_provider_settings()
        self.model_name = model_name or stored.get("model_name") or settings.model_name
        self.api_key = (
            api_key
            if api_key is not None
            else stored.get("openai_api_key") or settings.openai_api_key
        )
        self.base_url = (base_url or stored.get("openai_base_url") or settings.openai_base_url).rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(self.model_name and self.base_url and self.api_key)

    async def chat_json(self, system: str, user: str, fallback: dict[str, Any]) -> dict[str, Any]:
        if not self.configured:
            return fallback

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions", json=payload, headers=headers
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)

    async def chat_text(self, system: str, user: str, fallback: str) -> str:
        if not self.configured:
            return fallback

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.3,
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions", json=payload, headers=headers
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
