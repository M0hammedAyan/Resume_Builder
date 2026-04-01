from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ImpactModel(BaseModel):
    metric: str = Field(..., min_length=1, description="Primary metric affected")
    value: float = Field(..., description="Metric value")
    improvement: str = Field(..., min_length=1, description="Improvement details")


class CareerEvent(BaseModel):
    event_id: str = Field(..., min_length=1)
    timestamp: datetime
    role_context: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1)
    tools: list[str] = Field(default_factory=list)
    domain: str = Field(..., min_length=1)
    impact: ImpactModel
    evidence: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)

    @field_validator("tools")
    @classmethod
    def validate_tools(cls, value: list[str]) -> list[str]:
        cleaned = [tool.strip() for tool in value if tool and tool.strip()]
        if not cleaned:
            raise ValueError("tools must contain at least one non-empty value")
        return cleaned

    @field_validator("event_id", "role_context", "action", "domain")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("field cannot be empty")
        return stripped

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_id": "evt_ml_defect_001",
                "timestamp": "2025-11-15T10:30:00Z",
                "role_context": "Machine Learning Engineer",
                "action": "Built a CNN model for defect detection",
                "tools": ["Python", "PyTorch", "OpenCV"],
                "domain": "Manufacturing AI",
                "impact": {
                    "metric": "Defect detection accuracy",
                    "value": 92.0,
                    "improvement": "Improved accuracy by 18%"
                },
                "evidence": "Validation report v3",
                "confidence": 0.93
            }
        }
    )
