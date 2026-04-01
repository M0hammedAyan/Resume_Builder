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
