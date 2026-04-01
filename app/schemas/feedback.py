from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class FeedbackItem(BaseModel):
    event_id: UUID | None = None
    bullet_text: str = Field(..., min_length=3)
    rating: float = Field(..., ge=-1.0, le=1.0)
    reason: str | None = None
    score_breakdown: dict[str, Any] | None = None


class FeedbackUpdateIn(BaseModel):
    user_id: UUID
    feedback: list[FeedbackItem]
    resume_tone: str | None = None
    detail_level: str | None = None


class FeedbackUpdateOut(BaseModel):
    user_id: UUID
    updated_weights: dict[str, float]
    feedback_count: int
    personalization: dict[str, str]
