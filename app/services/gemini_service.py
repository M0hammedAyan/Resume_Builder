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
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

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
            logger.exception("Gemini API failed")
            raise RuntimeError(f"AI FAILED [{self.model_name}]: {exc}") from exc

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        text = (getattr(response, "text", "") or "").strip()

        logger.info("[AI] provider=gemini model=%s latency_ms=%s", self.model_name, elapsed_ms)

        if not text:
            raise RuntimeError("AI returned empty response")

        return text


# ✅ SINGLETON INSTANCE (IMPORTANT)
gemini_service = GeminiService()