from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from uuid import UUID

import requests
from sqlalchemy.orm import Session

from app.models.raw_event import RawEvent
from app.models.structured_event import StructuredEvent
from app.schemas.events import ImpactSchema, StructuredEventOut
from app.services.embedding_service import store_event_embedding
from app.services.user_service import ensure_user_exists

logger = logging.getLogger(__name__)


def _call_ollama_extract(raw_text: str, retries: int = 3) -> dict:
    """Call Ollama to extract strict structured JSON from raw event text."""
    base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")

    prompt = (
        "Convert user career event text to strict JSON only. No markdown.\n"
        "JSON schema:\n"
        "{\n"
        '  "timestamp": "ISO-8601 datetime",\n'
        '  "role_context": "string",\n'
        '  "domain": "string",\n'
        '  "action": "string",\n'
        '  "tools": ["string"],\n'
        '  "impact": {"metric": "string", "value": number, "improvement": "string"},\n'
        '  "evidence": "string or null",\n'
        '  "confidence": number between 0 and 1\n'
        "}\n"
        f"Input: {raw_text}"
    )

    session = requests.Session()
    last_error = ""
    for _ in range(retries):
        response = session.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0}},
            timeout=60,
        )
        response.raise_for_status()
        raw_output = response.json().get("response", "")
        logger.info("LLM raw extraction output: %s", raw_output)

        try:
            parsed = json.loads(raw_output)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            last_error = str(exc)
            match = re.search(r"\{[\s\S]*\}", raw_output)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception as parse_exc:  # noqa: BLE001
                    last_error = str(parse_exc)
    raise ValueError(f"Failed to extract valid structured JSON from LLM: {last_error}")


def process_and_store_event(db: Session, user_id: UUID, raw_text: str) -> StructuredEventOut:
    """Persist raw text, parse with LLM, and persist structured event."""
    ensure_user_exists(db, user_id)

    raw_event = RawEvent(user_id=user_id, raw_text=raw_text)
    db.add(raw_event)
    db.flush()

    parsed = _call_ollama_extract(raw_text)
    timestamp_raw = parsed.get("timestamp") or datetime.now(timezone.utc).isoformat()
    timestamp = datetime.fromisoformat(str(timestamp_raw).replace("Z", "+00:00"))
    tools = parsed.get("tools") or []
    impact = parsed.get("impact") or {}

    structured_event = StructuredEvent(
        user_id=user_id,
        raw_event_id=raw_event.id,
        timestamp=timestamp,
        role_context=str(parsed.get("role_context", "Unknown Role")),
        domain=str(parsed.get("domain", "General")),
        action=str(parsed.get("action", raw_text.strip())),
        tools=[str(tool) for tool in tools if str(tool).strip()],
        impact_metric=str(impact.get("metric", "Outcome")),
        impact_value=float(impact.get("value", 0.0)),
        impact_improvement=str(impact.get("improvement", "Improved outcomes")),
        evidence=(str(parsed.get("evidence")) if parsed.get("evidence") is not None else None),
        confidence=max(0.0, min(1.0, float(parsed.get("confidence", 0.6)))),
    )
    db.add(structured_event)
    db.commit()
    db.refresh(structured_event)

    # Keep vector table synchronized with newly inserted structured events.
    store_event_embedding(db, structured_event.id, structured_event.action)

    return StructuredEventOut(
        id=structured_event.id,
        user_id=structured_event.user_id,
        raw_event_id=structured_event.raw_event_id,
        timestamp=structured_event.timestamp,
        role_context=structured_event.role_context,
        domain=structured_event.domain,
        action=structured_event.action,
        tools=structured_event.tools,
        impact=ImpactSchema(
            metric=structured_event.impact_metric,
            value=structured_event.impact_value,
            improvement=structured_event.impact_improvement,
        ),
        evidence=structured_event.evidence,
        confidence=structured_event.confidence,
    )
