from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel


class CareerInsightsOut(BaseModel):
    growth_trend: str
    strength_areas: list[str]
    weak_areas: list[str]
    recommendations: list[str]


class InsightsAnalyzeIn(BaseModel):
    resume_data: dict[str, Any]
    use_llm: bool = True
    user_id: UUID | None = None
    resume_id: UUID | None = None


class InsightsAnalyzeOut(BaseModel):
    skill_distribution: dict[str, int]
    strength_areas: list[str]
    weak_areas: list[str]
    experience_level: int
    resume_score: int
    recommendations: list[str]


class InsightsDashboardOut(BaseModel):
    latest_score: int
    score_history: list[int]
    skill_coverage: dict[str, int]
    top_missing_skills: list[str]
    improvement_areas: list[str]
    resume_strength: str
    recommendations: list[str]
