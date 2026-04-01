from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.feedback import FeedbackUpdateIn, FeedbackUpdateOut
from app.services.feedback_service import update_weights
from app.services.personalization_service import update_personalization
from app.services.user_service import ensure_user_exists

router = APIRouter(tags=["feedback"])


@router.post("/feedback", response_model=FeedbackUpdateOut)
def submit_feedback(payload: FeedbackUpdateIn, db: Session = Depends(get_db)) -> FeedbackUpdateOut:
    """Store bullet feedback and adapt per-user scoring weights."""
    try:
        ensure_user_exists(db, payload.user_id)
        updated = update_weights(
            user_id=payload.user_id,
            feedback=[item.model_dump(mode="python") for item in payload.feedback],
            db=db,
        )
        personalization = update_personalization(
            db,
            user_id=payload.user_id,
            resume_tone=payload.resume_tone,
            detail_level=payload.detail_level,
        )
        db.commit()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to update weights: {exc}") from exc

    return FeedbackUpdateOut(
        user_id=payload.user_id,
        updated_weights=updated,
        feedback_count=len(payload.feedback),
        personalization=personalization,
    )
