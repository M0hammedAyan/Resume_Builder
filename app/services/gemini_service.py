from __future__ import annotations

import logging
import os
import time
from typing import Any, cast
import google.generativeai as genai

genai = cast(Any, genai)

logger = logging.getLogger(__name__)


class GeminiService:
    """Singleton Gemini service for resume text rewriting."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")
        fallback_env = os.getenv("GEMINI_FALLBACK_MODELS", "")
        fallback_models = [m.strip() for m in fallback_env.split(",") if m.strip()]
        if not fallback_models:
            fallback_models = [
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest",
                "gemini-2.0-flash",
                "gemini-pro",
            ]
        self.fallback_models = [m for m in fallback_models if m != self.model_name]

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY not set")

        getattr(genai, "configure")(api_key=self.api_key)
        self.model = getattr(genai, "GenerativeModel")(self.model_name)

    def _try_model(self, model_name: str, prompt: str):
        model = getattr(genai, "GenerativeModel")(model_name)
        response = model.generate_content(prompt)
        return model, response

    def rewrite_text(self, text: str, context: str) -> str:
        clean_text = text.strip()

        # 🔒 Validation
        if not clean_text:
            raise ValueError("Text cannot be empty")

        if len(clean_text) > 500:
            raise ValueError("Text too long (max 500 characters)")

        # 🧠 Better Prompt
        prompt = f"""
You are an expert resume writer.

Rewrite the following text based on its context.

Context: {context}

Rules:
- Use strong action verbs
- Make it ATS-friendly
- Keep it concise and impactful
- Preserve factual meaning
- Do NOT invent information

Formatting:
- Return ONLY one improved sentence
- No explanations
- No markdown

Text:
{clean_text}
"""

        logger.info("[AI] Rewrite request | provider=gemini | context=%s", context)
        improved_text = self.generate_text(prompt)
        logger.debug("[AI] Original: %s", clean_text)
        logger.debug("[AI] Improved: %s", improved_text)
        return improved_text

    def generate_text(self, prompt: str) -> str:
        started = time.perf_counter()
        try:
            response = self.model.generate_content(prompt)
        except Exception as exc:
            message = str(exc).lower()
            can_retry_model = "not found" in message or "is not supported" in message
            if not can_retry_model:
                logger.exception("Gemini API failed")
                raise RuntimeError("AI service unavailable") from exc

            for candidate in self.fallback_models:
                try:
                    logger.warning("Gemini model '%s' unavailable, retrying with '%s'", self.model_name, candidate)
                    model, response = self._try_model(candidate, prompt)
                    self.model = model
                    self.model_name = candidate
                    break
                except Exception:
                    continue
            else:
                logger.exception("Gemini API failed across all fallback models")
                raise RuntimeError("AI service unavailable") from exc

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        text = (getattr(response, "text", "") or "").strip()

        logger.info("[AI] provider=gemini model=%s latency_ms=%s", self.model_name, elapsed_ms)

        if not text:
            raise RuntimeError("AI returned empty response")

        return text


# ✅ SINGLETON INSTANCE (IMPORTANT)
gemini_service = GeminiService()