from __future__ import annotations

import logging
import time

from app.services.gemma_service import gemma_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

_GEMMA_TASKS = {"rewrite", "classification"}
_GEMINI_TASKS = {"analysis", "jd_matching", "resume_parsing"}


def route_ai_task(task_type: str, prompt: str) -> str:
    """Route task to Gemma or Gemini with cross-provider fallback on failure."""
    normalized = task_type.strip().lower()

    primary = "gemma" if normalized in _GEMMA_TASKS else "gemini"
    if normalized in _GEMINI_TASKS:
        primary = "gemini"

    started = time.perf_counter()

    if primary == "gemma":
        try:
            text = gemma_service.generate_text(prompt)
            total_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info("[AI-ROUTER] task=%s model=gemma total_ms=%s", normalized, total_ms)
            return text
        except Exception as exc:  # noqa: BLE001
            logger.warning("[AI-ROUTER] task=%s gemma_failed=%s fallback=gemini", normalized, exc)
            text = gemini_service.generate_text(prompt)
            total_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info("[AI-ROUTER] task=%s model=gemini(fallback) total_ms=%s", normalized, total_ms)
            return text

    try:
        text = gemini_service.generate_text(prompt)
        total_ms = round((time.perf_counter() - started) * 1000, 2)
        logger.info("[AI-ROUTER] task=%s model=gemini total_ms=%s", normalized, total_ms)
        return text
    except Exception as exc:  # noqa: BLE001
        logger.warning("[AI-ROUTER] task=%s gemini_failed=%s fallback=gemma", normalized, exc)
        text = gemma_service.generate_text(prompt)
        total_ms = round((time.perf_counter() - started) * 1000, 2)
        logger.info("[AI-ROUTER] task=%s model=gemma(fallback) total_ms=%s", normalized, total_ms)
        return text
