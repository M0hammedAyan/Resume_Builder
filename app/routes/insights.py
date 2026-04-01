from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insights import CareerInsightsOut
from app.services.insights_service import generate_career_insights
from app.services.user_service import ensure_user_exists

router = APIRouter(tags=["insights"])


@router.get("/insights", response_model=CareerInsightsOut)
def get_insights(
    user_id: UUID = Query(...),
    use_llm: bool = Query(False),
    db: Session = Depends(get_db),
) -> CareerInsightsOut:
    try:
        ensure_user_exists(db, user_id)
        result = generate_career_insights(db, user_id=user_id, use_llm=use_llm)
        return CareerInsightsOut(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to generate insights: {exc}") from exc
