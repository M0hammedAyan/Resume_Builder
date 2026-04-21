from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.auth import get_user_by_id
from app.crud.storage import (
    create_chat_turn,
    create_recruiter_analysis,
    create_resume,
    create_resume_version,
    create_uploaded_file,
    delete_resume,
    get_resume,
    list_chat_history,
    list_recruiter_analyses,
    list_resume_versions,
    list_resumes,
    list_uploaded_files,
    update_resume,
)
from app.schemas.storage import (
    ChatHistoryListOut,
    ChatHistoryOut,
    RecruiterAnalysisListOut,
    RecruiterAnalysisOut,
    ResumeCreateIn,
    ResumeListOut,
    ResumeOut,
    ResumeUpdateIn,
    ResumeVersionCreateIn,
    ResumeVersionOut,
    UploadedFileListOut,
    UploadedFileOut,
)

router = APIRouter(tags=["storage"])


def _ensure_user(db: Session, user_id: UUID):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/resumes", response_model=ResumeOut)
def create_resume_record(payload: ResumeCreateIn, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> ResumeOut:
    _ensure_user(db, user_id)
    resume = create_resume(
        db,
        user_id=user_id,
        title=payload.title,
        summary=payload.summary,
        selected_template=payload.selected_template,
        status=payload.status,
        resume_json=payload.resume_json,
    )
    db.commit()
    return ResumeOut.model_validate(resume)


@router.get("/resumes", response_model=ResumeListOut)
def read_resumes(user_id: UUID = Query(...), db: Session = Depends(get_db)) -> ResumeListOut:
    _ensure_user(db, user_id)
    return ResumeListOut(resumes=[ResumeOut.model_validate(item) for item in list_resumes(db, user_id=user_id)])


@router.get("/resumes/{resume_id}", response_model=ResumeOut)
def read_resume(resume_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> ResumeOut:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeOut.model_validate(resume)


@router.patch("/resumes/{resume_id}", response_model=ResumeOut)
def modify_resume(resume_id: UUID, payload: ResumeUpdateIn, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> ResumeOut:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    updated = update_resume(
        db,
        resume=resume,
        title=payload.title,
        summary=payload.summary,
        selected_template=payload.selected_template,
        status=payload.status,
        resume_json=payload.resume_json,
    )
    db.commit()
    return ResumeOut.model_validate(updated)


@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_resume(resume_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> None:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    delete_resume(db, resume=resume)
    db.commit()


@router.post("/resumes/{resume_id}/versions", response_model=ResumeVersionOut)
def create_resume_version_record(
    resume_id: UUID,
    payload: ResumeVersionCreateIn,
    user_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> ResumeVersionOut:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    version = create_resume_version(
        db,
        resume=resume,
        content=payload.content,
        source_text=payload.source_text,
        change_summary=payload.change_summary,
    )
    db.commit()
    return ResumeVersionOut.model_validate(version)


@router.get("/resumes/{resume_id}/versions", response_model=list[ResumeVersionOut])
def read_resume_versions(resume_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> list[ResumeVersionOut]:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return [ResumeVersionOut.model_validate(item) for item in list_resume_versions(db, resume_id=resume_id)]


@router.get("/chat-history", response_model=ChatHistoryListOut)
def read_chat_history(user_id: UUID = Query(...), resume_id: UUID | None = Query(default=None), db: Session = Depends(get_db)) -> ChatHistoryListOut:
    _ensure_user(db, user_id)
    messages = list_chat_history(db, user_id=user_id, resume_id=resume_id)
    return ChatHistoryListOut(messages=[ChatHistoryOut.model_validate(item) for item in messages])


@router.post("/chat-history", response_model=ChatHistoryOut)
def add_chat_history(
    user_id: UUID,
    role: str,
    message: str,
    resume_id: UUID | None = None,
    db: Session = Depends(get_db),
) -> ChatHistoryOut:
    _ensure_user(db, user_id)
    chat = create_chat_turn(db, user_id=user_id, role=role, message=message, resume_id=resume_id)
    db.commit()
    return ChatHistoryOut.model_validate(chat)


@router.get("/recruiter-analyses", response_model=RecruiterAnalysisListOut)
def read_recruiter_analyses(user_id: UUID = Query(...), resume_id: UUID | None = Query(default=None), db: Session = Depends(get_db)) -> RecruiterAnalysisListOut:
    _ensure_user(db, user_id)
    analyses = list_recruiter_analyses(db, user_id=user_id, resume_id=resume_id)
    return RecruiterAnalysisListOut(analyses=[RecruiterAnalysisOut.model_validate(item) for item in analyses])


@router.post("/recruiter-analyses", response_model=RecruiterAnalysisOut)
def add_recruiter_analysis(
    user_id: UUID,
    job_description: str,
    analysis: dict,
    score: float | None = None,
    resume_id: UUID | None = None,
    model_name: str | None = None,
    db: Session = Depends(get_db),
) -> RecruiterAnalysisOut:
    _ensure_user(db, user_id)
    row = create_recruiter_analysis(
        db,
        user_id=user_id,
        job_description=job_description,
        analysis=analysis,
        score=score,
        resume_id=resume_id,
        model_name=model_name,
    )
    db.commit()
    return RecruiterAnalysisOut.model_validate(row)


@router.get("/uploads", response_model=UploadedFileListOut)
def read_uploaded_files(user_id: UUID = Query(...), resume_id: UUID | None = Query(default=None), db: Session = Depends(get_db)) -> UploadedFileListOut:
    _ensure_user(db, user_id)
    files = list_uploaded_files(db, user_id=user_id, resume_id=resume_id)
    return UploadedFileListOut(files=[UploadedFileOut.model_validate(item) for item in files])


@router.post("/uploads", response_model=UploadedFileOut)
def add_uploaded_file(
    user_id: UUID,
    filename: str,
    content_type: str | None = None,
    storage_path: str | None = None,
    extracted_text: str | None = None,
    file_hash: str | None = None,
    resume_id: UUID | None = None,
    metadata: dict | None = None,
    db: Session = Depends(get_db),
) -> UploadedFileOut:
    _ensure_user(db, user_id)
    row = create_uploaded_file(
        db,
        user_id=user_id,
        filename=filename,
        content_type=content_type,
        storage_path=storage_path,
        extracted_text=extracted_text,
        file_hash=file_hash,
        resume_id=resume_id,
        metadata=metadata,
    )
    db.commit()
    return UploadedFileOut.model_validate(row)
