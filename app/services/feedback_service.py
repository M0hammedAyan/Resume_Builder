from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.bullet_feedback import BulletFeedback
from app.models.user_preference_profile import UserPreferenceProfile

DEFAULT_WEIGHTS = {
    "relevance": 0.4,
    "impact": 0.3,
    "recency": 0.2,
    "confidence": 0.1,
}
MIN_WEIGHT = 0.05
MAX_STEP = 0.05
LEARNING_RATE = 0.12
SMOOTHING = 0.2


def _normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    """Normalize and floor weights to keep updates stable."""
    floored = {key: max(MIN_WEIGHT, float(value)) for key, value in weights.items()}
    total = sum(floored.values()) or 1.0
    return {key: value / total for key, value in floored.items()}


def get_user_weights(db: Session, user_id: UUID) -> dict[str, float]:
    """Fetch normalized per-user weights, creating defaults when missing."""
    profile = db.query(UserPreferenceProfile).filter(UserPreferenceProfile.user_id == user_id).first()
    if not profile:
        profile = UserPreferenceProfile(
            user_id=user_id,
            relevance_weight=DEFAULT_WEIGHTS["relevance"],
            impact_weight=DEFAULT_WEIGHTS["impact"],
            recency_weight=DEFAULT_WEIGHTS["recency"],
            confidence_weight=DEFAULT_WEIGHTS["confidence"],
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return _normalize_weights(
        {
            "relevance": float(profile.relevance_weight),
            "impact": float(profile.impact_weight),
            "recency": float(profile.recency_weight),
            "confidence": float(profile.confidence_weight),
        }
    )


def _store_feedback_rows(db: Session, user_id: UUID, feedback: list[dict[str, Any]]) -> None:
    """Persist raw bullet feedback entries for auditing and future re-training."""
    for item in feedback:
        db.add(
            BulletFeedback(
                user_id=user_id,
                event_id=item.get("event_id"),
                bullet_text=str(item.get("bullet_text", "")).strip(),
                rating=float(item.get("rating", 0.0)),
                reason=item.get("reason"),
                score_breakdown=item.get("score_breakdown") or {},
            )
        )


def _feedback_signal(item: dict[str, Any]) -> dict[str, float]:
    """Convert score breakdown into normalized feature influence signal."""
    breakdown = item.get("score_breakdown") or {}
    raw = {
        "relevance": max(0.0, float(breakdown.get("relevance", 0.0))),
        "impact": max(0.0, float(breakdown.get("impact", 0.0))),
        "recency": max(0.0, float(breakdown.get("recency", 0.0))),
        "confidence": max(0.0, float(breakdown.get("confidence", 0.0))),
    }
    total = sum(raw.values())
    if total <= 0:
        return {"relevance": 0.25, "impact": 0.25, "recency": 0.25, "confidence": 0.25}
    return {key: value / total for key, value in raw.items()}


def _update_weights_with_db(db: Session, user_id: UUID, feedback: list[dict[str, Any]]) -> dict[str, float]:
    """Update per-user weights from feedback while keeping updates smooth and normalized."""
    current = get_user_weights(db, user_id)
    _store_feedback_rows(db, user_id, feedback)

    if not feedback:
        db.commit()
        return current

    deltas = {key: 0.0 for key in current}
    effective_count = 0

    for item in feedback:
        rating = max(-1.0, min(1.0, float(item.get("rating", 0.0))))
        if abs(rating) < 1e-9:
            continue

        signal = _feedback_signal(item)
        effective_count += 1

        for key in deltas:
            proposed_step = LEARNING_RATE * rating * (signal[key] - current[key])
            clipped_step = max(-MAX_STEP, min(MAX_STEP, proposed_step))
            deltas[key] += clipped_step

    if effective_count == 0:
        db.commit()
        return current

    averaged = {key: current[key] + (deltas[key] / effective_count) for key in current}
    normalized = _normalize_weights(averaged)

    # Smooth blending reduces oscillations between opposite feedback batches.
    blended = {
        key: (1 - SMOOTHING) * current[key] + SMOOTHING * normalized[key]
        for key in current
    }
    final_weights = _normalize_weights(blended)

    profile = db.query(UserPreferenceProfile).filter(UserPreferenceProfile.user_id == user_id).first()
    if not profile:
        profile = UserPreferenceProfile(user_id=user_id)
        db.add(profile)

    profile.relevance_weight = final_weights["relevance"]
    profile.impact_weight = final_weights["impact"]
    profile.recency_weight = final_weights["recency"]
    profile.confidence_weight = final_weights["confidence"]

    db.commit()
    return final_weights


def update_weights(
    user_id: UUID,
    feedback: list[dict[str, Any]],
    db: Session | None = None,
) -> dict[str, float]:
    """Public feedback update API: update_weights(user_id, feedback)."""
    if db is not None:
        return _update_weights_with_db(db, user_id, feedback)

    session = SessionLocal()
    try:
        return _update_weights_with_db(session, user_id, feedback)
    finally:
        session.close()
