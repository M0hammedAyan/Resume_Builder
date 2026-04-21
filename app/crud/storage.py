from __future__ import annotations

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.chat_history import ChatHistory
from app.models.insight_report import InsightReport
from app.models.recruiter_analysis import RecruiterAnalysis
from app.models.resume import Resume
from app.models.resume_version import ResumeVersion
from app.models.uploaded_file import UploadedFile


def create_resume(
    db: Session,
    *,
    user_id: UUID,
    title: str,
    summary: str | None = None,
    selected_template: str | None = None,
    status: str = "draft",
    resume_json: dict | None = None,
    is_parsed: bool = False,
) -> Resume:
    resume = Resume(
        user_id=user_id,
        title=title,
        summary=summary,
        selected_template=selected_template,
        status=status,
        resume_json=resume_json or {},
        is_parsed=is_parsed,
    )
    db.add(resume)
    db.flush()
    return resume


def list_resumes(db: Session, *, user_id: UUID) -> list[Resume]:
    return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.updated_at.desc().nullslast()).all()


def get_resume(db: Session, *, resume_id: UUID, user_id: UUID | None = None) -> Resume | None:
    query = db.query(Resume).filter(Resume.id == resume_id)
    if user_id is not None:
        query = query.filter(Resume.user_id == user_id)
    return query.first()


def update_resume(
    db: Session,
    *,
    resume: Resume,
    title: str | None = None,
    summary: str | None = None,
    selected_template: str | None = None,
    status: str | None = None,
    resume_json: dict | None = None,
) -> Resume:
    if title is not None:
        resume.title = title
    if summary is not None:
        resume.summary = summary
    if selected_template is not None:
        resume.selected_template = selected_template
    if status is not None:
        resume.status = status
    if resume_json is not None:
        resume.resume_json = resume_json
    db.flush()
    return resume


def delete_resume(db: Session, *, resume: Resume) -> None:
    db.delete(resume)
    db.flush()


def create_resume_version(
    db: Session,
    *,
    resume: Resume,
    content: dict,
    source_text: str | None = None,
    change_summary: str | None = None,
) -> ResumeVersion:
    next_version = (
        db.query(func.coalesce(func.max(ResumeVersion.version_number), 0))
        .filter(ResumeVersion.resume_id == resume.id)
        .scalar()
    )
    version = ResumeVersion(
        resume_id=resume.id,
        version_number=int(next_version or 0) + 1,
        content=content,
        source_text=source_text,
        change_summary=change_summary,
    )
    db.add(version)
    db.flush()
    resume.current_version_id = version.id
    return version


def list_resume_versions(db: Session, *, resume_id: UUID) -> list[ResumeVersion]:
    return (
        db.query(ResumeVersion)
        .filter(ResumeVersion.resume_id == resume_id)
        .order_by(ResumeVersion.version_number.asc())
        .all()
    )


def create_chat_turn(
    db: Session,
    *,
    user_id: UUID,
    role: str,
    message: str,
    resume_id: UUID | None = None,
    metadata: dict | None = None,
) -> ChatHistory:
    chat = ChatHistory(user_id=user_id, resume_id=resume_id, role=role, message=message, metadata_json=metadata)
    db.add(chat)
    db.flush()
    return chat


def list_chat_history(db: Session, *, user_id: UUID, resume_id: UUID | None = None) -> list[ChatHistory]:
    query = db.query(ChatHistory).filter(ChatHistory.user_id == user_id)
    if resume_id is not None:
        query = query.filter(ChatHistory.resume_id == resume_id)
    return query.order_by(ChatHistory.created_at.asc()).all()


def create_recruiter_analysis(
    db: Session,
    *,
    user_id: UUID,
    job_description: str,
    analysis: dict,
    score: float | None = None,
    resume_id: UUID | None = None,
    model_name: str | None = None,
    metadata: dict | None = None,
    missing_skills: list | None = None,
    suggestions: list | None = None,
) -> RecruiterAnalysis:
    row = RecruiterAnalysis(
        user_id=user_id,
        resume_id=resume_id,
        job_description=job_description,
        score=score,
        analysis=analysis,
        missing_skills=missing_skills or [],
        suggestions=suggestions or [],
        model_name=model_name,
        metadata_json=metadata,
    )
    db.add(row)
    db.flush()
    return row


def list_recruiter_analyses(db: Session, *, user_id: UUID, resume_id: UUID | None = None) -> list[RecruiterAnalysis]:
    query = db.query(RecruiterAnalysis).filter(RecruiterAnalysis.user_id == user_id)
    if resume_id is not None:
        query = query.filter(RecruiterAnalysis.resume_id == resume_id)
    return query.order_by(RecruiterAnalysis.created_at.desc()).all()


def create_uploaded_file(
    db: Session,
    *,
    user_id: UUID,
    filename: str,
    content_type: str | None = None,
    storage_path: str | None = None,
    extracted_text: str | None = None,
    file_hash: str | None = None,
    resume_id: UUID | None = None,
    metadata: dict | None = None,
) -> UploadedFile:
    row = UploadedFile(
        user_id=user_id,
        resume_id=resume_id,
        filename=filename,
        content_type=content_type,
        storage_path=storage_path,
        extracted_text=extracted_text,
        file_hash=file_hash,
        metadata_json=metadata,
    )
    db.add(row)
    db.flush()
    return row


def list_uploaded_files(db: Session, *, user_id: UUID, resume_id: UUID | None = None) -> list[UploadedFile]:
    query = db.query(UploadedFile).filter(UploadedFile.user_id == user_id)
    if resume_id is not None:
        query = query.filter(UploadedFile.resume_id == resume_id)
    return query.order_by(UploadedFile.created_at.desc()).all()


def create_insight_report(
    db: Session,
    *,
    user_id: UUID,
    analysis: dict,
    resume_id: UUID | None = None,
) -> InsightReport:
    row = InsightReport(user_id=user_id, resume_id=resume_id, analysis=analysis)
    db.add(row)
    db.flush()
    return row


def list_insight_reports(db: Session, *, user_id: UUID, resume_id: UUID | None = None) -> list[InsightReport]:
    query = db.query(InsightReport).filter(InsightReport.user_id == user_id)
    if resume_id is not None:
        query = query.filter(InsightReport.resume_id == resume_id)
    return query.order_by(InsightReport.created_at.desc()).all()
