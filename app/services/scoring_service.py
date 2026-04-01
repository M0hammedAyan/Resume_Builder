from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Sequence

from app.services.embedding_service import cosine_similarity

DEFAULT_WEIGHTS = {
    "relevance": 0.4,
    "impact": 0.3,
    "recency": 0.2,
    "confidence": 0.1,
}


def _recency_score(timestamp: datetime, decay_lambda: float = 0.01) -> float:
    """Compute exponential time-decay based on event age in days."""
    now = datetime.now(timezone.utc)
    ts = timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)
    age_days = max((now - ts).total_seconds() / 86400.0, 0.0)
    return float(math.exp(-decay_lambda * age_days))


def _impact_score(event: dict[str, Any]) -> float:
    """Compute impact score using metric/improvement presence rule."""
    score = 0.0
    if str(event.get("impact_metric", "")).strip():
        score += 1.0
    if str(event.get("impact_improvement", "")).strip():
        score += 0.5
    return score


def _normalize_weights(weights: dict[str, float] | None) -> dict[str, float]:
    """Normalize weight map to sum to 1 with safe defaults."""
    if not weights:
        return DEFAULT_WEIGHTS.copy()

    merged = {
        "relevance": float(weights.get("relevance", DEFAULT_WEIGHTS["relevance"])),
        "impact": float(weights.get("impact", DEFAULT_WEIGHTS["impact"])),
        "recency": float(weights.get("recency", DEFAULT_WEIGHTS["recency"])),
        "confidence": float(weights.get("confidence", DEFAULT_WEIGHTS["confidence"])),
    }
    total = sum(max(0.0, value) for value in merged.values())
    if total <= 0:
        return DEFAULT_WEIGHTS.copy()
    return {key: max(0.0, value) / total for key, value in merged.items()}


def score_event(
    event: dict[str, Any],
    job_embedding: Sequence[float],
    weights: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Compute weighted score and detailed breakdown for a single event."""
    normalized_weights = _normalize_weights(weights)

    event_embedding = [float(value) for value in (event.get("embedding") or [])]
    relevance = float(cosine_similarity(event_embedding, job_embedding))
    impact = float(_impact_score(event))
    recency = float(_recency_score(event["timestamp"]))
    confidence = float(event.get("confidence", 0.0))

    final_score = (
        normalized_weights["relevance"] * relevance
        + normalized_weights["impact"] * impact
        + normalized_weights["recency"] * recency
        + normalized_weights["confidence"] * confidence
    )

    return {
        "score": float(final_score),
        "breakdown": {
            "relevance": relevance,
            "impact": impact,
            "recency": recency,
            "confidence": confidence,
            "weights": {
                "relevance": normalized_weights["relevance"],
                "impact": normalized_weights["impact"],
                "recency": normalized_weights["recency"],
                "confidence": normalized_weights["confidence"],
            },
        },
    }
