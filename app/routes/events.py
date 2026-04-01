from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.events import EventIn, StructuredEventOut
from app.services.event_service import process_and_store_event

router = APIRouter(tags=["events"])


@router.post("/events", response_model=StructuredEventOut)
def create_event(payload: EventIn, db: Session = Depends(get_db)) -> StructuredEventOut:
    """Ingest a raw event, parse via LLM, store structured event and embedding."""
    try:
        return process_and_store_event(db, user_id=payload.user_id, raw_text=payload.raw_text)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to process event: {exc}") from exc
