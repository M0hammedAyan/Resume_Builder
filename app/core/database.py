from __future__ import annotations

import importlib
import logging
import os
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "CAREEROS_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/careeros",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base SQLAlchemy declarative class for CareerOS models."""


try:
    Vector = getattr(importlib.import_module("pgvector.sqlalchemy"), "Vector")
except Exception:
    from sqlalchemy.types import UserDefinedType

    class Vector(UserDefinedType):
        """Fallback vector type for environments where pgvector is not installed."""

        def __init__(self, dim: int) -> None:
            self.dim = dim

        def get_col_spec(self, **_: object) -> str:
            return f"vector({self.dim})"


def init_db() -> None:
    """Enable PostgreSQL extensions and create all tables."""
    from app.models import (  # noqa: F401
        bullet_feedback,
        decision_log,
        event_embedding,
        event_score,
        generated_output,
        job_embedding,
        raw_event,
        structured_event,
        user,
        user_personalization_profile,
        user_preference_profile,
    )

    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)
    logger.info("CareerOS database initialized")


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for a transactional DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
