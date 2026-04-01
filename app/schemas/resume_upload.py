"""Schemas for resume file upload and analysis."""
from typing import Optional
from pydantic import BaseModel


class ResumeParseContent(BaseModel):
    """Parsed resume content structure."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    experience: list[str]
    projects: list[str]
    skills: list[str]
    education: list[str]
    raw_text: str


class ResumeUploadOut(BaseModel):
    """Response from resume file upload endpoint."""
    parse_result: ResumeParseContent
    resume_id: str


class ResumeImprovementSuggestion(BaseModel):
    """A single improvement suggestion."""
    section: str  # experience, projects, skills, education, achievements
    current_bullet: Optional[str] = None
    suggestion: str
    reason: str
    impact: str  # high, medium, low


class ResumeAnalysisIn(BaseModel):
    """Request for resume analysis and improvement."""
    user_id: str
    resume_content: ResumeParseContent
    target_job_description: Optional[str] = None


class ResumeAnalysisOut(BaseModel):
    """Response with resume analysis and improvement suggestions."""
    overall_score: float  # 0-100
    strength_areas: list[str]
    improvement_areas: list[str]
    suggestions: list[ResumeImprovementSuggestion]
    summary: str
