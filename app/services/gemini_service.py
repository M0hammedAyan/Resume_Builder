from __future__ import annotations

import logging
import os
from typing import Any, cast
import google.generativeai as genai

genai = cast(Any, genai)

logger = logging.getLogger(__name__)


class GeminiService:
    """Singleton Gemini service for resume text rewriting."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY not set")

        getattr(genai, "configure")(api_key=self.api_key)
        self.model = getattr(genai, "GenerativeModel")(self.model_name)

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

        try:
            logger.info(f"[AI] Rewrite request | context={context}")
            response = self.model.generate_content(prompt)
        except Exception as exc:
            logger.exception("Gemini API failed")
            raise RuntimeError("AI service unavailable") from exc

        improved_text = (getattr(response, "text", "") or "").strip()

        if not improved_text:
            raise RuntimeError("AI returned empty response")

        logger.debug(f"[AI] Original: {clean_text}")
        logger.debug(f"[AI] Improved: {improved_text}")

        return improved_text


# ✅ SINGLETON INSTANCE (IMPORTANT)
gemini_service = GeminiService()