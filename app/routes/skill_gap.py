from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.skill_gap import SkillGapOut
from app.services.skill_gap_service import analyze_skill_gap
from app.services.user_service import ensure_user_exists

router = APIRouter(tags=["skill-gap"])


@router.get("/skill-gap", response_model=SkillGapOut)
def skill_gap(
    user_id: UUID = Query(...),
    job_description: str = Query(..., min_length=10),
    db: Session = Depends(get_db),
) -> SkillGapOut:
    try:
        ensure_user_exists(db, user_id)
        result = analyze_skill_gap(db, user_id=user_id, job_description=job_description)
        return SkillGapOut(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Skill gap analysis failed: {exc}") from exc
