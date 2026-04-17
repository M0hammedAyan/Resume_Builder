from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterSuccessOut(BaseModel):
    message: str


AuthRegisterIn = RegisterRequest
AuthLoginIn = LoginRequest
LoginSuccessOut = TokenResponse
TokenOut = TokenResponse


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
