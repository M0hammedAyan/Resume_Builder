from __future__ import annotations

from pydantic import BaseModel


class CareerInsightsOut(BaseModel):
    growth_trend: str
    strength_areas: list[str]
    weak_areas: list[str]
    recommendations: list[str]
