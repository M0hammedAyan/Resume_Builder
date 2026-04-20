"""Schemas for resume file upload and analysis."""

from typing import Optional

from pydantic import BaseModel, Field


class ResumePersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    links: list[str] = Field(default_factory=list)
    summary: str | None = None


class ResumeEducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    year: str = ""
    cgpa: str = ""
    description: str = ""


class ResumeExperienceItem(BaseModel):
    title: str = ""
    company: str = ""
    description: str = ""


class ResumeProjectItem(BaseModel):
    title: str = ""
    company: str = ""
    description: str = ""
    link: str = ""


class ResumeParseContent(BaseModel):
    """Parsed resume content structure."""
    personal: ResumePersonalInfo = Field(default_factory=ResumePersonalInfo)
    education: list[ResumeEducationItem] = Field(default_factory=list)
    experience: list[ResumeExperienceItem] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[ResumeProjectItem] = Field(default_factory=list)
    summary: Optional[str] = None
    raw_text: Optional[str] = None
    is_parsed: bool = True

    model_config = {"extra": "ignore"}


class ResumeUploadOut(BaseModel):
    """Response from resume file upload endpoint."""
    parse_result: ResumeParseContent
    resume_id: str
    is_parsed: bool = True


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
