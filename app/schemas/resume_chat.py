"""Schemas for resume chat and JD analysis."""
from typing import Optional
from pydantic import BaseModel


class ResumeChatIn(BaseModel):
    """Request for resume chat endpoint."""
    user_id: str
    user_input: str
    resume_id: str
    context: Optional[str] = None


class ResumeBulletInfo(BaseModel):
    """Information about a generated bullet."""
    section: str  # experience, projects, skills, education, achievements
    content: str


class ResumeChatOut(BaseModel):
    """Response from resume chat endpoint."""
    response: str
    generated_bullet: Optional[ResumeBulletInfo] = None
    follow_up_questions: list[str]
    confidence: float


class JDAnalysisIn(BaseModel):
    """Request for JD eligibility analysis."""
    user_id: str
    job_description: str
    resume_id: Optional[str] = None


class JDEligibilityOut(BaseModel):
    """Response for JD eligibility analysis."""
    eligibility_score: float  # 0-100
    matched_skills: list[str]
    missing_skills: list[str]
    improvements: list[str]
    summary: str


class JDFeedbackIn(BaseModel):
    """Request for JD feedback."""
    user_id: str
    job_description: str


class JDFeedbackOut(BaseModel):
    """Response with improvement feedback."""
    feedback: list[str]
