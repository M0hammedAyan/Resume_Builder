
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.job_match import JobMatchIn, JobMatchOut
from app.services.job_match_service import run_job_match
from app.services.user_service import ensure_user_exists

router = APIRouter(tags=["job-match"])


@router.post("/job-match", response_model=JobMatchOut)
def job_match(payload: JobMatchIn, db: Session = Depends(get_db)) -> JobMatchOut:
    try:
        ensure_user_exists(db, payload.user_id)
        result = run_job_match(db, user_id=payload.user_id, job_description=payload.job_description)
        return JobMatchOut(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Job match failed: {exc}") from exc
