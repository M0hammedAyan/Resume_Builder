from __future__ import annotations

import json
import os
import re

import requests


def _extract_json(raw_text: str) -> object:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", raw_text)
        if not match:
            raise
        return json.loads(match.group(0))


def generate_resume_bullets(
    events: list[dict],
    job_description: str,
    retries: int = 3,
    resume_tone: str = "professional",
    detail_level: str = "balanced",
) -> list[str]:
    """Generate concise, metric-rich resume bullets with strict no-hallucination rules."""
    if not events:
        return []

    base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")

    event_payload = []
    for event in events:
        event_payload.append(
            {
                "id": str(event.get("id")),
                "role_context": event.get("role_context"),
                "domain": event.get("domain"),
                "action": event.get("action"),
                "tools": event.get("tools") or [],
                "impact_metric": event.get("impact_metric"),
                "impact_value": event.get("impact_value"),
                "impact_improvement": event.get("impact_improvement"),
                "evidence": event.get("evidence"),
            }
        )

    prompt = (
        "Generate resume bullets from ONLY the provided events. Output strict JSON only.\n"
        "Schema: {\"bullets\": [\"...\"]}\n"
        f"Tone: {resume_tone}\n"
        f"Detail level: {detail_level}\n"
        "Rules:\n"
        "1) No hallucination. Never invent tools, numbers, or outcomes.\n"
        "2) Use STAR style implicitly.\n"
        "3) Start each bullet with a strong action verb.\n"
        "4) Include metrics if available.\n"
        "5) Max 20 words each bullet.\n"
        f"Job description: {job_description}\n"
        f"Events: {json.dumps(event_payload)}"
    )

    session = requests.Session()
    for _ in range(retries):
        response = session.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0}},
            timeout=60,
        )
        response.raise_for_status()
        parsed = _extract_json(response.json().get("response", ""))

        bullets = []
        if isinstance(parsed, dict):
            bullets = parsed.get("bullets", [])
        elif isinstance(parsed, list):
            bullets = parsed

        if isinstance(bullets, list) and bullets:
            cleaned = []
            for bullet in bullets:
                words = str(bullet).strip().split()
                if words:
                    cleaned.append(" ".join(words[:20]))
            if cleaned:
                return cleaned

    fallback = []
    for event in event_payload:
        sentence = (
            f"Built {str(event['action']).lower()} using {', '.join(event['tools'])}; "
            f"improved {event['impact_metric']} by {event['impact_improvement']}."
        )
        fallback.append(" ".join(sentence.split()[:20]))
    return fallback
