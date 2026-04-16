from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.auth import get_user_by_id
from app.crud.storage import create_insight_report
from app.schemas.insights import CareerInsightsOut, InsightsAnalyzeIn, InsightsAnalyzeOut
from app.services.insights_service import analyze_resume_data_insights, generate_career_insights
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


@router.post("/insights/analyze", response_model=InsightsAnalyzeOut)
def analyze_insights(payload: InsightsAnalyzeIn, db: Session = Depends(get_db)) -> InsightsAnalyzeOut:
    try:
        result = analyze_resume_data_insights(
            resume_data=payload.resume_data,
            use_llm=payload.use_llm,
        )
        if payload.user_id is not None and get_user_by_id(db, payload.user_id):
            create_insight_report(
                db,
                user_id=payload.user_id,
                resume_id=payload.resume_id,
                analysis=result,
            )
            db.commit()
        return InsightsAnalyzeOut(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to analyze resume insights: {exc}") from exc
