from __future__ import annotations

from pydantic import BaseModel, Field


class RecruiterSimulateIn(BaseModel):
    resume_text: str = Field(..., min_length=20)
    job_description: str = Field(..., min_length=20)
    use_llm: bool = False


class RecruiterSimulateOut(BaseModel):
    score: float
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]


class RecruiterLensAnalyzeOut(BaseModel):
    score: float
    skill_match: float
    preferred_skill_match: float
    experience_match: float
    keyword_context_match: float
    missing_skills: list[str]
    suggestions: list[str]
    ats_issues: list[str]
    structured_resume: dict
    structured_jd: dict
    match_details: dict
    metadata: dict
