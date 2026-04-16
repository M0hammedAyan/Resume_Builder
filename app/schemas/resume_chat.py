"""Schemas for resume chat and JD analysis."""
from typing import Any, Literal, Optional
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


class ResumeAssistantAction(BaseModel):
    """A structured action that frontend can apply to the editor state."""

    type: Literal[
        "add_section",
        "remove_section",
        "reorder_sections",
        "update_skills",
        "add_project",
        "rewrite_bullet",
        "update_summary",
        "design_recommendation",
    ]
    section: Optional[str] = None
    content: Optional[str] = None
    skills: Optional[list[str]] = None
    order: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class ResumeAssistantIn(BaseModel):
    """Structured input sent to Gemini for resume assistant actions."""

    user_prompt: str
    resume_data: dict[str, Any]
    job_description: str = ""
    uploaded_files_text: str = ""


class ResumeAssistantOut(BaseModel):
    """Structured assistant output consumed by frontend action executor."""

    suggestions: list[str]
    missing_sections: list[str]
    skills_to_add: list[str]
    skills_to_remove: list[str]
    design_suggestions: list[str]
    actions: list[ResumeAssistantAction]
    model: str
