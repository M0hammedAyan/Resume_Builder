from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ResumeGenerateIn(BaseModel):
    user_id: UUID
    job_description: str = Field(..., min_length=10)
    k: int = Field(default=5, ge=1, le=20)


class ResumeGenerateOut(BaseModel):
    bullets: list[str]
    scores: dict[str, Any]
    selected_events: list[dict[str, Any]]
    explanations: list[dict[str, Any]]
    evaluation: dict[str, Any]
    personalization: dict[str, str] | None = None


class ResumeVersionItem(BaseModel):
    id: UUID
    created_at: datetime
    ats_score: float
    job_description: str
    bullets_count: int


class ResumeVersionListOut(BaseModel):
    versions: list[ResumeVersionItem]


class ResumeVersionCompareOut(BaseModel):
    version_a_id: UUID
    version_b_id: UUID
    score_delta: float
    added_bullets: list[str]
    removed_bullets: list[str]
    common_bullets: list[str]
