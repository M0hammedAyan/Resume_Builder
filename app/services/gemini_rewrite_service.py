from __future__ import annotations

import logging
import os

import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiRewriteService:
    """Rewrite resume snippets using Gemini with ATS-focused constraints."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.model_name = os.getenv("GOOGLE_GEMINI_MODEL", "gemini-2.0-flash")
        self._model = None

        if self.api_key:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)

    def rewrite_text(self, text: str, context: str) -> str:
        if not self._model:
            raise RuntimeError("Gemini is not configured. Set GOOGLE_API_KEY environment variable.")

        clean_text = text.strip()
        if not clean_text:
            raise ValueError("text cannot be empty")

        prompt = (
            "You are an expert resume writer. Rewrite the text for ATS optimization. "
            "Improve clarity, use strong action verbs, keep it concise, and preserve factual meaning. "
            "Do not invent metrics or technologies. Return only the improved text with no bullets, quotes, or markdown. "
            f"Context: {context}.\n"
            f"Original text: {clean_text}"
        )

        try:
            response = self._model.generate_content(prompt)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Gemini rewrite request failed")
            raise RuntimeError("AI rewrite service is temporarily unavailable") from exc

        improved = (getattr(response, "text", "") or "").strip()

        if not improved:
            raise RuntimeError("AI rewrite service is temporarily unavailable")

        return improved
