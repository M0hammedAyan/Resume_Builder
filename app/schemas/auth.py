from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuthRegisterIn(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)
    name: str | None = None
    experience_level: str | None = None
    target_roles: list[str] = Field(default_factory=list)


class AuthLoginIn(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None = None
    name: str | None = None
    role: str
    is_active: bool
    experience_level: str | None = None
    target_roles: list[str]
    created_at: datetime
    updated_at: datetime | None = None
