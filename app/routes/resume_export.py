from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from app.core.database import get_db
from app.services.resume_export_service import cleanup_export_file, export_resume_docx, export_resume_pdf

router = APIRouter(tags=["resume-export"])


@router.get("/resume/download/pdf")
def download_resume_pdf(
    user_id: UUID = Query(...),
    template: str = Query("ats-minimal"),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Generate and return downloadable resume PDF for a user/template pair."""
    try:
        file_path, download_name = export_resume_pdf(db, user_id=user_id, template_name=template)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"PDF export failed: {exc}") from exc

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=download_name,
        background=BackgroundTask(cleanup_export_file, file_path),
    )


@router.get("/resume/download/docx")
def download_resume_docx(
    user_id: UUID = Query(...),
    template: str = Query("ats-minimal"),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Generate and return downloadable resume DOCX for a user/template pair."""
    try:
        file_path, download_name = export_resume_docx(db, user_id=user_id, template_name=template)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"DOCX export failed: {exc}") from exc

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=download_name,
        background=BackgroundTask(cleanup_export_file, file_path),
    )
