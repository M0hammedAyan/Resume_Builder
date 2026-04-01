from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, cast
from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError

from app.db.database import (
    DecisionLogRecord,
    EventScoreRecord,
    GeneratedOutputRecord,
    RawEventRecord,
    SessionLocal,
    StructuredEventRecord,
    UserRecord,
)
from app.models.career_event import CareerEvent, ImpactModel

logger = logging.getLogger(__name__)

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


class EventRepository:
    def __init__(self, fallback_path: Path | None = None) -> None:
        base_dir = Path(__file__).resolve().parents[2]
        self.fallback_path = fallback_path or (base_dir / "app" / "db" / "events_fallback.json")
        self.fallback_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.fallback_path.exists():
            self.fallback_path.write_text("[]", encoding="utf-8")

    def add_event(
        self,
        event: CareerEvent,
        user_id: str | None = None,
        raw_text: str | None = None,
    ) -> CareerEvent:
        try:
            return self._add_event_sql(event, user_id=user_id, raw_text=raw_text)
        except SQLAlchemyError as exc:
            logger.exception("SQLite insert failed, using JSON fallback: %s", exc)
            self._add_event_json(event)
            return event

    def list_events(self, user_id: str | None = None) -> list[CareerEvent]:
        try:
            return self._list_events_sql(user_id=user_id)
        except SQLAlchemyError as exc:
            logger.exception("SQLite read failed, using JSON fallback: %s", exc)
            return self._list_events_json()

    def save_event_score(
        self,
        event_id: str,
        job_hash: str,
        relevance: float,
        impact: float,
        recency: float,
        confidence: float,
        total_score: float,
    ) -> None:
        with SessionLocal() as db:
            existing = (
                db.query(EventScoreRecord)
                .filter(EventScoreRecord.event_id == event_id, EventScoreRecord.job_hash == job_hash)
                .first()
            )
            if existing:
                db.query(EventScoreRecord).filter(
                    EventScoreRecord.event_id == event_id,
                    EventScoreRecord.job_hash == job_hash,
                ).update(
                    {
                        "relevance": relevance,
                        "impact": impact,
                        "recency": recency,
                        "confidence": confidence,
                        "total_score": total_score,
                    }
                )
                db.commit()
                return

            db.add(
                EventScoreRecord(
                    id=str(uuid4()),
                    event_id=event_id,
                    job_hash=job_hash,
                    relevance=relevance,
                    impact=impact,
                    recency=recency,
                    confidence=confidence,
                    total_score=total_score,
                )
            )
            db.commit()

    def save_generated_output(
        self,
        user_id: str,
        job_description: str,
        output_type: str,
        content: dict[str, Any],
        ats_score: float,
    ) -> None:
        with SessionLocal() as db:
            resolved_user_id = self._ensure_user_sql(db, user_id)
            db.add(
                GeneratedOutputRecord(
                    id=str(uuid4()),
                    user_id=resolved_user_id,
                    job_description=job_description,
                    output_type=output_type,
                    content_json=json.dumps(content),
                    ats_score=ats_score,
                )
            )
            db.commit()

    def save_decision_log(
        self,
        event_id: str,
        job_hash: str,
        decision: str,
        relevance: float,
        impact: float,
        recency: float,
        reason: str,
    ) -> None:
        with SessionLocal() as db:
            db.add(
                DecisionLogRecord(
                    id=str(uuid4()),
                    event_id=event_id,
                    job_hash=job_hash,
                    decision=decision,
                    relevance=relevance,
                    impact=impact,
                    recency=recency,
                    reason=reason,
                )
            )
            db.commit()

    def _add_event_sql(
        self,
        event: CareerEvent,
        user_id: str | None = None,
        raw_text: str | None = None,
    ) -> CareerEvent:
        with SessionLocal() as db:
            resolved_user_id = self._ensure_user_sql(db, user_id)

            raw_event = RawEventRecord(
                id=str(uuid4()),
                user_id=resolved_user_id,
                raw_text=raw_text or event.action,
            )
            db.add(raw_event)

            structured_id = event.event_id if self._is_uuid_like(event.event_id) else str(uuid4())
            existing = db.query(StructuredEventRecord).filter(StructuredEventRecord.id == structured_id).first()
            if existing:
                db.commit()
                return self._record_to_event(existing)

            record = StructuredEventRecord(
                id=structured_id,
                user_id=resolved_user_id,
                raw_event_id=raw_event.id,
                timestamp=event.timestamp,
                role_context=event.role_context,
                action=event.action,
                tools_json=json.dumps(event.tools),
                domain=event.domain,
                impact_metric=event.impact.metric,
                impact_value=event.impact.value,
                impact_improvement=event.impact.improvement,
                evidence=event.evidence,
                confidence=event.confidence,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return self._record_to_event(record)

    def _list_events_sql(self, user_id: str | None = None) -> list[CareerEvent]:
        with SessionLocal() as db:
            query = db.query(StructuredEventRecord)
            if user_id:
                query = query.filter(StructuredEventRecord.user_id == user_id)
            rows = query.order_by(StructuredEventRecord.timestamp.desc()).all()
            return [self._record_to_event(row) for row in rows]

    def _add_event_json(self, event: CareerEvent) -> None:
        events = self._list_events_json()
        if any(existing.event_id == event.event_id for existing in events):
            return

        payload = [item.model_dump(mode="json") for item in events]
        payload.append(event.model_dump(mode="json"))
        self.fallback_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _list_events_json(self) -> list[CareerEvent]:
        if not self.fallback_path.exists():
            return []

        raw = self.fallback_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []

        data = json.loads(raw)
        return [CareerEvent.model_validate(item) for item in data]

    @staticmethod
    def _record_to_event(record: StructuredEventRecord) -> CareerEvent:
        timestamp = record.timestamp
        if not isinstance(timestamp, datetime):
            timestamp = datetime.fromisoformat(str(timestamp))

        impact_value = cast(float, cast(Any, record.impact_value))
        confidence = cast(float, cast(Any, record.confidence))

        return CareerEvent(
            event_id=str(record.id),
            timestamp=timestamp,
            role_context=str(record.role_context),
            action=str(record.action),
            tools=json.loads(str(record.tools_json)),
            domain=str(record.domain),
            impact=ImpactModel(
                metric=str(record.impact_metric),
                value=impact_value,
                improvement=str(record.impact_improvement),
            ),
            evidence=str(record.evidence) if record.evidence is not None else None,
            confidence=confidence,
        )

    @staticmethod
    def _is_uuid_like(value: str) -> bool:
        chunks = value.split("-")
        if len(chunks) != 5:
            return False
        return all(bool(chunk) for chunk in chunks)

    @staticmethod
    def _ensure_user_sql(db: Any, user_id: str | None) -> str:
        resolved_user_id = user_id or DEFAULT_USER_ID
        existing = db.query(UserRecord).filter(UserRecord.id == resolved_user_id).first()
        if existing:
            return resolved_user_id

        db.add(
            UserRecord(
                id=resolved_user_id,
                name="CareerOS User",
                email=f"user-{resolved_user_id[:8]}@careeros.local",
                experience_level="unknown",
                target_roles_json="[]",
            )
        )
        db.flush()
        return resolved_user_id


_event_repository: EventRepository | None = None


def get_event_repository() -> EventRepository:
    global _event_repository
    if _event_repository is None:
        _event_repository = EventRepository()
    return _event_repository
