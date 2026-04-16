from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ResumeCreateIn(BaseModel):
    title: str = Field(..., min_length=1)
    summary: str | None = None
    resume_json: dict[str, Any] = Field(default_factory=dict)
    status: str = "draft"


class ResumeUpdateIn(BaseModel):
    title: str | None = None
    summary: str | None = None
    resume_json: dict[str, Any] | None = None
    status: str | None = None


class ResumeVersionCreateIn(BaseModel):
    content: dict[str, Any]
    source_text: str | None = None
    change_summary: str | None = None


class ResumeVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID
    version_number: int
    content: dict[str, Any]
    source_text: str | None = None
    change_summary: str | None = None
    created_at: datetime


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    summary: str | None = None
    resume_json: dict[str, Any]
    status: str
    current_version_id: UUID | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ResumeListOut(BaseModel):
    resumes: list[ResumeOut]


class ChatHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    user_id: UUID
    resume_id: UUID | None = None
    role: str
    message: str
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime


class ChatHistoryListOut(BaseModel):
    messages: list[ChatHistoryOut]


class RecruiterAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    user_id: UUID
    resume_id: UUID | None = None
    job_description: str
    score: float | None = None
    analysis: dict[str, Any]
    missing_skills: list[str]
    suggestions: list[str]
    model_name: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime


class RecruiterAnalysisListOut(BaseModel):
    analyses: list[RecruiterAnalysisOut]


class UploadedFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    user_id: UUID
    resume_id: UUID | None = None
    filename: str
    content_type: str | None = None
    storage_path: str | None = None
    file_hash: str | None = None
    extracted_text: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime


class UploadedFileListOut(BaseModel):
    files: list[UploadedFileOut]
