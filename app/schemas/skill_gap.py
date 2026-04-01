from __future__ import annotations

from pydantic import BaseModel


class PriorityItem(BaseModel):
    skill: str
    priority: int
    reason: str


class SkillGapOut(BaseModel):
    missing_skills: list[str]
    priority_ranking: list[PriorityItem]
