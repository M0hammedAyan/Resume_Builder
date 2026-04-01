from __future__ import annotations

import hashlib
from functools import lru_cache
from typing import Sequence
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.event_embedding import EventEmbedding
from app.models.job_embedding import JobEmbedding


def _load_model():
    """Load sentence-transformer used for semantic retrieval."""
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError(
            "sentence-transformers is required for embeddings. Install from requirements.txt"
        ) from exc

    return SentenceTransformer("all-MiniLM-L6-v2")


@lru_cache(maxsize=2048)
def get_embedding(text: str) -> tuple[float, ...]:
    """Generate cached embedding for input text."""
    model = _load_model()
    embedding = model.encode(text or "", normalize_embeddings=False)
    return tuple(float(x) for x in embedding.tolist())


def cosine_similarity(vec1: Sequence[float], vec2: Sequence[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def store_event_embedding(db: Session, event_id: UUID, text_value: str) -> EventEmbedding:
    """Upsert event embedding in pgvector table."""
    vector = list(get_embedding(text_value))
    existing = db.query(EventEmbedding).filter(EventEmbedding.event_id == event_id).first()
    if existing:
        existing.embedding = vector
        db.commit()
        db.refresh(existing)
        return existing

    record = EventEmbedding(event_id=event_id, embedding=vector)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_or_create_job_embedding(db: Session, job_description: str) -> JobEmbedding:
    """Return existing job embedding by hash or create a new one."""
    job_hash = hashlib.sha256(job_description.strip().encode("utf-8")).hexdigest()
    existing = db.query(JobEmbedding).filter(JobEmbedding.job_hash == job_hash).first()
    if existing:
        return existing

    vector = list(get_embedding(job_description))
    record = JobEmbedding(job_hash=job_hash, job_description=job_description, embedding=vector)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
