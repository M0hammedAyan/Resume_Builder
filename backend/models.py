"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    user_message: str = Field(..., min_length=1, description="User's message")


class AIResponse(BaseModel):
    """Model for AI response from Ollama"""
    intent: str
    section: str
    summary: str
    resume_draft: str
    linkedin_draft: str


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    detected_intent: str
    detected_section: str
    extracted_summary: str
    resume_suggestion: str
    linkedin_suggestion: str
    confirmation_required: bool = True


class ConfirmRequest(BaseModel):
    """Request model for confirm endpoint"""
    action: Literal["approve", "edit", "reject"]
    section: str
    content: Optional[Dict[str, Any]] = None  # Final content if approved/edited


class ConfirmResponse(BaseModel):
    """Response model for confirm endpoint"""
    success: bool
    message: str
    profile: Dict[str, Any]


class ProfileEntry(BaseModel):
    """Model for a single profile entry"""
    title: str
    description: str
    tags: List[str] = []
    date: Optional[str] = None
    source: str = "user-confirmed"


class Profile(BaseModel):
    """Model for the complete professional profile"""
    education: List[ProfileEntry] = []
    experience: List[ProfileEntry] = []
    projects: List[ProfileEntry] = []
    skills: List[ProfileEntry] = []
    achievements: List[ProfileEntry] = []

