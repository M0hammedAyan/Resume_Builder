from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RewriteContext = Literal["experience", "project", "summary"]


class AIRewriteIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    context: RewriteContext


class AIRewriteOut(BaseModel):
    improved_text: str
