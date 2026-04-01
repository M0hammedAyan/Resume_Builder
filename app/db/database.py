from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy import Column, DateTime, Float, String, Text, UniqueConstraint, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parents[2]
DATABASE_URL = os.getenv("CAREEROS_DATABASE_URL", f"sqlite:///{BASE_DIR / 'careeros.db'}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRecord(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(Text, nullable=True)
    email = Column(Text, unique=True, nullable=True)
    experience_level = Column(Text, nullable=True)
    # SQLite-compatible storage for target_roles TEXT[]
    target_roles_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, nullable=False, default=utcnow)


class RawEventRecord(Base):
    __tablename__ = "raw_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class StructuredEventRecord(Base):
    __tablename__ = "structured_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    raw_event_id = Column(String(36), nullable=False, index=True)

    timestamp = Column(DateTime, nullable=False)
    role_context = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    # SQLite-compatible storage for tools TEXT[]
    tools_json = Column(Text, nullable=False)

    impact_metric = Column(Text, nullable=False)
    impact_value = Column(Float, nullable=False)
    impact_improvement = Column(Text, nullable=False)

    evidence = Column(Text, nullable=True)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class EventScoreRecord(Base):
    __tablename__ = "event_scores"
    __table_args__ = (UniqueConstraint("event_id", "job_hash", name="uq_event_job_hash"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    event_id = Column(String(36), nullable=False, index=True)
    job_hash = Column(Text, nullable=False, index=True)
    relevance = Column(Float, nullable=False)
    impact = Column(Float, nullable=False)
    recency = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    total_score = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class GeneratedOutputRecord(Base):
    __tablename__ = "generated_outputs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    job_description = Column(Text, nullable=False)
    output_type = Column(Text, nullable=False)
    # SQLite-compatible storage for content JSONB
    content_json = Column(Text, nullable=False)
    ats_score = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class DecisionLogRecord(Base):
    __tablename__ = "decision_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    event_id = Column(String(36), nullable=False, index=True)
    job_hash = Column(Text, nullable=False, index=True)
    decision = Column(Text, nullable=False)
    relevance = Column(Float, nullable=False)
    impact = Column(Float, nullable=False)
    recency = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
