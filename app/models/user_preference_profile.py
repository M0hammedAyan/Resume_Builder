from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserPreferenceProfile(Base):
    """Per-user adaptive scoring weights learned from feedback."""

    __tablename__ = "user_preference_profiles"
    __table_args__ = (Index("idx_user_preference_profiles_user_id", "user_id", unique=True),)

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    relevance_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.4)
    impact_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    recency_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.2)
    confidence_weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
