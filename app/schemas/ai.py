from __future__ import annotations

from typing import Any
from typing import Literal
from typing import Optional

from pydantic import BaseModel, Field

RewriteContext = Literal["experience", "project", "summary"]


class AIRewriteIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    context: RewriteContext


class AIRewriteOut(BaseModel):
    improved_text: str


ChatAction = Literal["add", "update", "delete"]
ChatSection = Literal["projects", "experience", "skills", "education"]


class AIChatUpdateIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    resume_id: str = Field(..., min_length=1)


class AIChatUpdateAction(BaseModel):
    action: ChatAction
    section: ChatSection
    data: dict[str, Any] = Field(default_factory=dict)


class AIChatUpdateOut(BaseModel):
    status: Literal["success", "error"]
    action: str
    updated_resume: dict[str, Any]
    message: str
    applied_action: Optional[AIChatUpdateAction] = None


StructuredIntent = Literal[
    "add_project",
    "add_experience",
    "add_education",
    "add_skill",
    "update_summary",
    "unknown",
]


class AIParseUpdateIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class AIParsedResumeData(BaseModel):
    title: str = ""
    description: str = ""
    company: str = ""
    institution: str = ""
    degree: str = ""
    skills: list[str] = Field(default_factory=list)


class AIParseUpdateOut(BaseModel):
    intent: StructuredIntent
    data: dict[str, Any]


class AIChatAssistIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    resume_id: str = Field(..., min_length=1)
    pending_intent: str | None = None
    pending_data: dict[str, Any] = Field(default_factory=dict)


class AIChatAssistOut(BaseModel):
    intent: str
    suggested_update: dict[str, Any] | None = None
    missing_fields: list[str] = Field(default_factory=list)
    needs_clarification: bool = False
    question: str | None = None
    new_skills: list[str] = Field(default_factory=list)
    confirmation_required: bool = False
