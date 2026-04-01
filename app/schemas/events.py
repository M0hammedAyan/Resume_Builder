from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ImpactSchema(BaseModel):
    metric: str = Field(..., min_length=1)
    value: float
    improvement: str = Field(..., min_length=1)


class EventIn(BaseModel):
    user_id: UUID
    raw_text: str = Field(..., min_length=5)


class StructuredEventOut(BaseModel):
    id: UUID
    user_id: UUID
    raw_event_id: UUID
    timestamp: datetime
    role_context: str
    domain: str
    action: str
    tools: list[str]
    impact: ImpactSchema
    evidence: str | None = None
    confidence: float = Field(..., ge=0, le=1)
