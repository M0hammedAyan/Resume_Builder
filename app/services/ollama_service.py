from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone

import requests

from app.models.career_event import CareerEvent

logger = logging.getLogger(__name__)


class OllamaService:
    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        resolved_base_url = base_url or os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434")
        resolved_model = model or os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")

        self.base_url = resolved_base_url.rstrip("/")
        self.model = resolved_model
        self.session = requests.Session()

    def extract_career_event(self, natural_language_input: str, retries: int = 3) -> CareerEvent:
        if not natural_language_input.strip():
            raise ValueError("Input text must not be empty")

        last_error = ""
        for attempt in range(1, retries + 1):
            prompt = self._build_extract_prompt(natural_language_input, last_error)
            raw_output, parsed_output = self._call_json(prompt)
            logger.info("Ollama raw output (extract, attempt %s): %s", attempt, raw_output)
            logger.info("Ollama parsed output (extract, attempt %s): %s", attempt, parsed_output)

            try:
                if isinstance(parsed_output, dict) and "event" in parsed_output:
                    parsed_output = parsed_output["event"]

                if isinstance(parsed_output, dict):
                    parsed_output.setdefault("event_id", f"evt_{uuid.uuid4().hex[:12]}")
                    parsed_output.setdefault("timestamp", datetime.now(timezone.utc).isoformat())

                event = CareerEvent.model_validate(parsed_output)
                return event
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Invalid event JSON on attempt %s: %s", attempt, exc)

        raise ValueError(f"Unable to extract valid CareerEvent JSON from Ollama: {last_error}")

    def generate_resume_bullets(self, events: list[CareerEvent], retries: int = 3) -> list[str]:
        if not events:
            return []

        event_payload = [event.model_dump(mode="json") for event in events]
        last_error = ""
        for attempt in range(1, retries + 1):
            prompt = self._build_bullet_prompt(event_payload, last_error)
            raw_output, parsed_output = self._call_json(prompt)
            logger.info("Ollama raw output (bullets, attempt %s): %s", attempt, raw_output)
            logger.info("Ollama parsed output (bullets, attempt %s): %s", attempt, parsed_output)

            try:
                bullets = []
                if isinstance(parsed_output, dict):
                    bullets = parsed_output.get("bullets", [])
                elif isinstance(parsed_output, list):
                    bullets = parsed_output

                if not isinstance(bullets, list) or not bullets:
                    raise ValueError("No bullets returned")

                normalized = [self._limit_words(str(bullet).strip(), 20) for bullet in bullets if str(bullet).strip()]
                if not normalized:
                    raise ValueError("Bullet list is empty after normalization")

                return normalized
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Invalid bullet JSON on attempt %s: %s", attempt, exc)

        return [self._fallback_bullet(event) for event in events]

    def _call_json(self, prompt: str) -> tuple[str, object]:
        response = self.session.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0},
            },
            timeout=60,
        )
        response.raise_for_status()

        payload = response.json()
        raw_text = payload.get("response", "")

        parsed: object
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            parsed = self._extract_json_fragment(raw_text)

        return raw_text, parsed

    @staticmethod
    def _extract_json_fragment(raw_text: str) -> object:
        match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", raw_text)
        if not match:
            raise ValueError("No JSON object or array found in Ollama output")
        return json.loads(match.group(0))

    @staticmethod
    def _build_extract_prompt(user_input: str, previous_error: str) -> str:
        error_hint = f"\nPrevious validation error: {previous_error}" if previous_error else ""
        return (
            "You are an information extraction system. Convert the user text into strict JSON only. "
            "Do not include markdown or extra text.\n"
            "Required schema:\n"
            "{\n"
            '  "event_id": "string",\n'
            '  "timestamp": "ISO-8601 datetime",\n'
            '  "role_context": "string",\n'
            '  "action": "string",\n'
            '  "tools": ["string"],\n'
            '  "domain": "string",\n'
            '  "impact": {"metric": "string", "value": number, "improvement": "string"},\n'
            '  "evidence": "string or null",\n'
            '  "confidence": number between 0 and 1\n'
            "}\n"
            f"User input: {user_input}\n"
            "If a field is unknown, infer conservatively and keep confidence lower."
            f"{error_hint}"
        )

    @staticmethod
    def _build_bullet_prompt(event_payload: list[dict], previous_error: str) -> str:
        error_hint = f"\nPrevious validation error: {previous_error}" if previous_error else ""
        return (
            "Generate resume bullets using only provided event data. Strict JSON only.\n"
            "Output format: {\"bullets\": [\"bullet 1\", \"bullet 2\"]}\n"
            "Rules:\n"
            "- Use STAR style implicitly\n"
            "- Start each bullet with a strong action verb\n"
            "- Include metrics when available\n"
            "- Max 20 words per bullet\n"
            "- No hallucinations, no invented tools/metrics/claims\n"
            f"Events: {json.dumps(event_payload)}"
            f"{error_hint}"
        )

    @staticmethod
    def _limit_words(text: str, max_words: int) -> str:
        words = text.split()
        return " ".join(words[:max_words])

    @staticmethod
    def _fallback_bullet(event: CareerEvent) -> str:
        metric = f"{event.impact.metric} at {event.impact.value}"
        improvement = event.impact.improvement
        bullet = (
            f"Built {event.action.lower()} using {', '.join(event.tools)}; achieved {metric}; {improvement}."
        )
        return OllamaService._limit_words(bullet, 20)


ollama_service = OllamaService()
