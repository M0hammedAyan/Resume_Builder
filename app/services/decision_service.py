from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.decision_log import DecisionLog


def log_decisions(db: Session, job_hash: str, explanations: list[dict]) -> None:
    """Persist event-level include/exclude decisions and score breakdowns."""
    for item in explanations:
        breakdown = item.get("score_breakdown") or {}
        raw_event_id = item["event_id"]
        event_id = UUID(str(raw_event_id))
        db.add(
            DecisionLog(
                event_id=event_id,
                job_hash=job_hash,
                decision=item.get("decision", "excluded"),
                relevance=float(breakdown.get("relevance", 0.0)),
                impact=float(breakdown.get("impact", 0.0)),
                recency=float(breakdown.get("recency", 0.0)),
                reason=str(item.get("reason", "No reason provided")),
            )
        )
    db.commit()
