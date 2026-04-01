from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.embedding_service import get_or_create_job_embedding


def _vector_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in vector) + "]"


def retrieve_similar_events_by_embedding(
    db: Session,
    user_id: UUID,
    job_embedding: list[float],
    limit: int = 20,
) -> list[dict]:
    """Given a job embedding, fetch top similar events ordered by cosine distance."""

    sql = text(
        """
        SELECT
            se.id,
            se.user_id,
            se.raw_event_id,
            se.timestamp,
            se.role_context,
            se.domain,
            se.action,
            se.tools,
            se.impact_metric,
            se.impact_value,
            se.impact_improvement,
            se.evidence,
            se.confidence,
            ee.embedding,
            (1 - (ee.embedding <=> CAST(:job_embedding AS vector))) AS similarity
        FROM structured_events se
        JOIN event_embeddings ee ON ee.event_id = se.id
        WHERE se.user_id = :user_id
        ORDER BY ee.embedding <=> CAST(:job_embedding AS vector)
        LIMIT :limit
        """
    )

    rows = db.execute(
        sql,
        {
            "user_id": str(user_id),
            "job_embedding": _vector_literal(job_embedding),
            "limit": limit,
        },
    ).mappings()

    return [dict(row) for row in rows]


def get_similar_events(db: Session, job_description: str, user_id: UUID, limit: int = 20) -> dict:
    """Embed a job description and fetch top similar events for a user."""
    job_embedding_record = get_or_create_job_embedding(db, job_description)
    job_embedding = [float(value) for value in job_embedding_record.embedding]
    events = retrieve_similar_events_by_embedding(db, user_id=user_id, job_embedding=job_embedding, limit=limit)

    return {
        "job_hash": job_embedding_record.job_hash,
        "job_embedding": job_embedding,
        "events": events,
    }
