from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserPersonalizationProfile(Base):
    """Per-user preferences for output tone and level of detail."""

    __tablename__ = "user_personalization_profiles"
    __table_args__ = (Index("idx_user_personalization_profiles_user_id", "user_id", unique=True),)

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    resume_tone: Mapped[str] = mapped_column(Text, nullable=False, default="professional")
    detail_level: Mapped[str] = mapped_column(Text, nullable=False, default="balanced")
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
