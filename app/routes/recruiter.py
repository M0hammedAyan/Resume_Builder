from __future__ import annotations

import json
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.crud.auth import get_user_by_id
from app.crud.storage import create_recruiter_analysis, get_resume
from app.models.user import User
from app.schemas.recruiter import (
    RecruiterLensAnalyzeOut,
    RecruiterLensAnalyzeRequest,
    RecruiterLensAnalyzeResponse,
    RecruiterSimulateIn,
    RecruiterSimulateOut,
)
from app.services.recruiter_lens_service import RecruiterLensService
from app.services.recruiter_scoring_service import scoring_pipeline
from app.services.recruiter_simulator_service import simulate_recruiter_review

router = APIRouter(tags=["recruiter"])


def _persist_recruiter_analysis_resilient(
    db: Session,
    *,
    user_id: UUID,
    resume_id: UUID,
    job_description: str,
    result: dict,
) -> None:
    try:
        create_recruiter_analysis(
            db,
            user_id=user_id,
            resume_id=resume_id,
            job_description=job_description,
            analysis=result,
            score=float(result.get("score", 0.0)),
            missing_skills=result.get("missing_skills", []),
            suggestions=result.get("suggestions", []),
            model_name="hybrid-structured-semantic-gemini",
            metadata=result.get("metadata", {}),
        )
        db.commit()
        return
    except Exception:
        db.rollback()

    # Fallback for environments where ORM model has drifted from DB columns.
    stmt = text(
        """
        INSERT INTO recruiter_analyses (
            id, user_id, resume_id, job_description, score, analysis, missing_skills,
            suggestions, model_name, metadata
        ) VALUES (
            CAST(:id AS uuid), CAST(:user_id AS uuid), CAST(:resume_id AS uuid), :job_description,
            :score, CAST(:analysis AS jsonb), CAST(:missing_skills AS jsonb),
            CAST(:suggestions AS jsonb), :model_name, CAST(:metadata AS jsonb)
        )
        """
    )
    try:
        db.execute(
            stmt,
            {
                "id": str(uuid4()),
                "user_id": str(user_id),
                "resume_id": str(resume_id),
                "job_description": job_description,
                "score": float(result.get("score", 0.0)),
                "analysis": json.dumps(result),
                "missing_skills": json.dumps(result.get("missing_skills", [])),
                "suggestions": json.dumps(result.get("suggestions", [])),
                "model_name": "hybrid-structured-semantic-gemini",
                "metadata": json.dumps(result.get("metadata", {})),
            },
        )
        db.commit()
    except Exception:
        db.rollback()


@router.post("/recruiter-lens/analyze", response_model=RecruiterLensAnalyzeResponse)
def recruiter_lens_analyze_structured(
    payload: RecruiterLensAnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecruiterLensAnalyzeResponse:
    try:
        resume_uuid = UUID(payload.resume_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid resume_id") from exc

    resume = get_resume(db, resume_id=resume_uuid, user_id=user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        result = scoring_pipeline(dict(resume.resume_json or {}), payload.job_description)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Recruiter analysis failed: {exc}") from exc

    _persist_recruiter_analysis_resilient(
        db,
        user_id=user.id,
        resume_id=resume.id,
        job_description=payload.job_description,
        result=result,
    )

    return RecruiterLensAnalyzeResponse(**result)


@router.post("/recruiter/simulate", response_model=RecruiterSimulateOut)
def recruiter_simulate(payload: RecruiterSimulateIn) -> RecruiterSimulateOut:
    """Run recruiter simulation over resume text and job description."""
    try:
        result = simulate_recruiter_review(
            resume_text=payload.resume_text,
            job_description=payload.job_description,
            use_llm=payload.use_llm,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Recruiter simulation failed: {exc}") from exc

    return RecruiterSimulateOut(**result)


@router.post("/recruiter/lens/analyze", response_model=RecruiterLensAnalyzeOut)
@router.post("/recruiter/lens-analyze", response_model=RecruiterLensAnalyzeOut)
async def recruiter_lens_analyze(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    user_id: str | None = Form(default=None),
    resume_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> RecruiterLensAnalyzeOut:
    """Run structured semantic recruiter analysis over resume file and JD."""
    try:
        resume_bytes = await file.read()
        if not resume_bytes:
            raise HTTPException(status_code=400, detail="Resume file is empty")

        service = RecruiterLensService()
        result = service.analyze_resume(
            resume_bytes=resume_bytes,
            filename=file.filename or "resume.pdf",
            job_description=job_description,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Recruiter Lens analysis failed: {exc}") from exc

    if user_id:
        try:
            user_uuid = UUID(user_id)
            if get_user_by_id(db, user_uuid):
                create_recruiter_analysis(
                    db,
                    user_id=user_uuid,
                    resume_id=UUID(resume_id) if resume_id else None,
                    job_description=job_description,
                    analysis=result,
                    score=float(result.get("score", 0.0)) if result.get("score") is not None else None,
                    missing_skills=result.get("missing_skills", []),
                    suggestions=result.get("suggestions", []),
                    model_name=result.get("metadata", {}).get("model") if isinstance(result.get("metadata"), dict) else None,
                    metadata=result.get("metadata"),
                )
                db.commit()
        except Exception:
            pass

    return RecruiterLensAnalyzeOut(**result)
