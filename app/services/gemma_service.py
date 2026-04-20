from __future__ import annotations

import logging
import os
import time

import requests

logger = logging.getLogger(__name__)


class GemmaService:
    """Gemma local inference via Ollama for fast and low-cost tasks."""

    def __init__(self) -> None:
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self.model_name = os.getenv("GEMMA_MODEL", "gemma:2b")
        self.timeout_seconds = int(os.getenv("GEMMA_TIMEOUT_SECONDS", "45"))

    def generate_text(self, prompt: str) -> str:
        started = time.perf_counter()
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("[AI] provider=gemma error=%s", exc)
            raise RuntimeError("Gemma service unavailable") from exc

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        text = str(payload.get("response", "")).strip()

        logger.info("[AI] provider=gemma latency_ms=%s model=%s", elapsed_ms, self.model_name)

        if not text:
            raise RuntimeError("Gemma returned empty response")

        return text


# Singleton
gemma_service = GemmaService()
