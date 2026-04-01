from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.recruiter import RecruiterSimulateIn, RecruiterSimulateOut
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
