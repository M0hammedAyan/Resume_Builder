from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class JobMatchIn(BaseModel):
    user_id: UUID
    job_description: str = Field(..., min_length=10)


class JobMatchOut(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    recommended_actions: list[str]
