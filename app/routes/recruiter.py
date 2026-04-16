from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.auth import get_user_by_id
from app.crud.storage import create_recruiter_analysis
from app.schemas.recruiter import RecruiterLensAnalyzeOut, RecruiterSimulateIn, RecruiterSimulateOut
from app.services.recruiter_lens_service import RecruiterLensService
from app.services.recruiter_simulator_service import simulate_recruiter_review

router = APIRouter(tags=["recruiter"])


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
