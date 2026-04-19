from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.ai import AIRewriteIn, AIRewriteOut
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/rewrite", response_model=AIRewriteOut)
def rewrite_text(payload: AIRewriteIn) -> AIRewriteOut:
    try:
        improved = gemini_service.rewrite_text(
            payload.text,
            payload.context
        )
        return AIRewriteOut(improved_text=improved)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {exc}"
        ) from exc