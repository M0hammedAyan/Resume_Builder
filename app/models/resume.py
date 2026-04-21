from __future__ import annotations

from datetime import datetime
from enum import Enum as PyEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResumeStatus(str, PyEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Resume(Base):
    __tablename__ = "resumes"
    __table_args__ = (
        Index("idx_resumes_user_id", "user_id"),
        Index("idx_resumes_current_version_id", "current_version_id"),
        Index("idx_resumes_created_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_template: Mapped[str | None] = mapped_column(Text, nullable=True, server_default=text("'modern-minimal'"))
    resume_json: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    is_parsed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    status: Mapped[ResumeStatus] = mapped_column(
        Enum(ResumeStatus, name="resume_status", native_enum=True),
        nullable=False,
        server_default=text("'draft'"),
    )
    current_version_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("resume_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="resumes")
    versions = relationship(
        "ResumeVersion",
        back_populates="resume",
        cascade="all, delete-orphan",
        foreign_keys="ResumeVersion.resume_id",
    )
    current_version = relationship("ResumeVersion", foreign_keys=[current_version_id], post_update=True)
    chat_history = relationship("ChatHistory", back_populates="resume", cascade="all, delete-orphan")
    recruiter_analyses = relationship("RecruiterAnalysis", back_populates="resume", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="resume", cascade="all, delete-orphan")