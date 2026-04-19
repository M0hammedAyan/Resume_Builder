from __future__ import annotations

import json
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.auth import get_user_by_id
from app.crud.storage import create_chat_turn, create_resume, create_resume_version, create_uploaded_file, get_resume
from app.models.generated_output import GeneratedOutput
from app.models.structured_event import StructuredEvent
from app.schemas.resume import (
    ResumeGenerateIn,
    ResumeGenerateOut,
    ResumeVersionCompareOut,
    ResumeVersionItem,
    ResumeVersionListOut,
)
from app.schemas.resume_chat import (
    ResumeChatIn,
    ResumeChatOut,
    JDAnalysisIn,
    JDEligibilityOut,
    JDFeedbackIn,
    JDFeedbackOut,
    ResumeAssistantOut,
)
from app.schemas.storage import ResumeOut

from app.services.pipeline_service import run_vector_selection_pipeline
from app.services.resume_chat_service import ResumeChatService, JDAnalysisService
from app.services.gemini_resume_assistant_service import GeminiResumeAssistantService
from app.services.uploaded_file_text_service import UploadedFileTextService
from app.services.resume_parser import parse_resume_text
from app.services.resume_parsing_service import ResumeAnalysisService
from app.schemas.resume_upload import (
    ResumeUploadOut,
    ResumeAnalysisIn,
    ResumeAnalysisOut,
    ResumeParseContent,
)

router = APIRouter(tags=["resume"])


@router.post("/resume/generate-assistant-actions", response_model=ResumeAssistantOut)
async def generate_resume_assistant_actions(
    user_prompt: str = Form(...),
    resume_data: str = Form(...),
    job_description: str = Form(""),
    uploaded_files_text: str = Form(""),
    files: list[UploadFile] = File(default=[]),
) -> ResumeAssistantOut:
    """Generate structured resume editing actions using Gemini."""
    try:
        try:
            parsed_resume_data = json.loads(resume_data)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="resume_data must be valid JSON") from exc

        if not isinstance(parsed_resume_data, dict):
            raise HTTPException(status_code=400, detail="resume_data must be a JSON object")

        extracted_chunks: list[str] = []
        extractor = UploadedFileTextService()

        for upload in files:
            file_content = await upload.read()
            if not file_content:
                continue

            filename = upload.filename or "uploaded_document"
            try:
                text = extractor.extract_text(file_content, filename)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc

            if text.strip():
                extracted_chunks.append(f"File: {filename}\n{text.strip()}")

        merged_uploaded_text = uploaded_files_text.strip()
        if extracted_chunks:
            files_text = "\n\n".join(extracted_chunks)
            merged_uploaded_text = (
                f"{merged_uploaded_text}\n\n{files_text}" if merged_uploaded_text else files_text
            )

        service = GeminiResumeAssistantService()
        result = service.generate_actions(
            user_prompt=user_prompt,
            resume_data=parsed_resume_data,
            job_description=job_description,
            uploaded_files_text=merged_uploaded_text,
        )

        return ResumeAssistantOut(
            suggestions=result.get("suggestions", []),
            missing_sections=result.get("missing_sections", []),
            skills_to_add=result.get("skills_to_add", []),
            skills_to_remove=result.get("skills_to_remove", []),
            design_suggestions=result.get("design_suggestions", []),
            actions=result.get("actions", []),
            model=result.get("model", "gemini-1.5-pro"),
        )
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate assistant actions: {exc}",
        ) from exc


@router.post("/resume/generate", response_model=ResumeGenerateOut)
def generate_resume(payload: ResumeGenerateIn, db: Session = Depends(get_db)) -> ResumeGenerateOut:
    """Run vector retrieval + scoring + selection and return selected events with explanations."""
    try:
        result = run_vector_selection_pipeline(
            db,
            user_id=payload.user_id,
            job_description=payload.job_description,
            k=payload.k,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to generate resume selection: {exc}") from exc

    return ResumeGenerateOut(
        selected_events=result["selected_events"],
        scores={"event_scores": result["scores"], "weights": result["weights"]},
        explanations=result["explanations"],
        bullets=result["bullets"],
        evaluation=result["evaluation"],
        personalization=result.get("personalization"),
    )


@router.get("/resume/versions", response_model=ResumeVersionListOut)
def list_resume_versions(
    user_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ResumeVersionListOut:
    rows = (
        db.query(GeneratedOutput)
        .filter(GeneratedOutput.user_id == user_id, GeneratedOutput.output_type == "resume")
        .order_by(GeneratedOutput.created_at.desc())
        .limit(limit)
        .all()
    )

    versions = []
    for item in rows:
        content = item.content if isinstance(item.content, dict) else {}
        bullets = content.get("bullets", []) if isinstance(content, dict) else []
        versions.append(
            ResumeVersionItem(
                id=item.id,
                created_at=item.created_at,
                ats_score=float(item.ats_score),
                job_description=item.job_description,
                bullets_count=len(bullets) if isinstance(bullets, list) else 0,
            )
        )

    return ResumeVersionListOut(versions=versions)


@router.get("/resume/versions/compare", response_model=ResumeVersionCompareOut)
def compare_resume_versions(
    version_a_id: UUID = Query(...),
    version_b_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> ResumeVersionCompareOut:
    version_a = db.query(GeneratedOutput).filter(GeneratedOutput.id == version_a_id).first()
    version_b = db.query(GeneratedOutput).filter(GeneratedOutput.id == version_b_id).first()

    if not version_a or not version_b:
        raise HTTPException(status_code=404, detail="One or both resume versions were not found")

    a_content = version_a.content if isinstance(version_a.content, dict) else {}
    b_content = version_b.content if isinstance(version_b.content, dict) else {}

    a_bullets = [str(item) for item in a_content.get("bullets", [])] if isinstance(a_content, dict) else []
    b_bullets = [str(item) for item in b_content.get("bullets", [])] if isinstance(b_content, dict) else []

    a_set = set(a_bullets)
    b_set = set(b_bullets)

    return ResumeVersionCompareOut(
        version_a_id=version_a.id,
        version_b_id=version_b.id,
        score_delta=round(float(version_b.ats_score) - float(version_a.ats_score), 2),
        added_bullets=sorted(list(b_set - a_set)),
        removed_bullets=sorted(list(a_set - b_set)),
        common_bullets=sorted(list(a_set & b_set)),
    )


@router.post("/resume/chat", response_model=ResumeChatOut)
def resume_chat(payload: ResumeChatIn, db: Session = Depends(get_db)) -> ResumeChatOut:
    """
    Process user input for resume building with AI assistance.
    
    This endpoint:
    - Takes user descriptions of achievements
    - Generates professional resume bullets
    - Asks follow-up questions to gather more details
    - Returns confidence score for the generated content
    """
    user_uuid = UUID(payload.user_id)
    user = get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    chat_service = ResumeChatService()
    result = chat_service.process_user_input(payload.user_input, payload.context)

    resume_uuid = UUID(payload.resume_id)
    create_chat_turn(
        db,
        user_id=user_uuid,
        resume_id=resume_uuid,
        role="user",
        message=payload.user_input,
        metadata={"context": payload.context},
    )
    create_chat_turn(
        db,
        user_id=user_uuid,
        resume_id=resume_uuid,
        role="assistant",
        message=result["response"],
        metadata={
            "confidence": result["confidence"],
            "generated_bullet": result.get("generated_bullet"),
            "follow_up_questions": result.get("follow_up_questions", []),
        },
    )
    db.commit()

    return ResumeChatOut(
        response=result["response"],
        generated_bullet=result["generated_bullet"],
        follow_up_questions=result["follow_up_questions"],
        confidence=result["confidence"],
    )


@router.post("/resume/jd-eligibility", response_model=JDEligibilityOut)
def analyze_jd_eligibility(payload: JDAnalysisIn, db: Session = Depends(get_db)) -> JDEligibilityOut:
    """
    Analyze how well the user matches a job description.
    
    This endpoint:
    - Extracts requirements from the JD
    - Compares against user's event history
    - Provides eligibility score and improvement suggestions
    """
    # Get user's events to extract skills
    events = db.query(StructuredEvent).filter(StructuredEvent.user_id == payload.user_id).all()
    
    user_events = [
        {
            "domain": event.domain,
            "tools": event.tools or [],
            "action": event.action,
        }
        for event in events
    ]
    
    jd_service = JDAnalysisService()
    result = jd_service.analyze_eligibility(payload.job_description, user_events)
    
    return JDEligibilityOut(
        eligibility_score=result["eligibility_score"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        improvements=result["improvements"],
        summary=result["summary"],
    )


@router.post("/resume/jd-feedback", response_model=JDFeedbackOut)
def get_jd_feedback(payload: JDFeedbackIn, db: Session = Depends(get_db)) -> JDFeedbackOut:
    """
    Get detailed improvement feedback based on job description analysis.
    
    This endpoint:
    - Analyzes the provided JD
    - Extracts user skills from event history
    - Provides specific, actionable recommendations
    """
    # Get user's events to extract skills
    events = db.query(StructuredEvent).filter(StructuredEvent.user_id == payload.user_id).all()
    
    user_skills = set()
    for event in events:
        if event.tools:
            user_skills.update(event.tools)
        if event.domain:
            user_skills.add(event.domain)
    
    jd_service = JDAnalysisService()
    feedback = jd_service.get_feedback(payload.job_description, list(user_skills))
    
    return JDFeedbackOut(feedback=feedback)


@router.post("/resume/upload", response_model=ResumeUploadOut)
async def upload_resume_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    title: str = Form(default="Uploaded Resume"),
    db: Session = Depends(get_db),
) -> ResumeUploadOut:
    """
    Upload and parse an existing resume file (PDF, DOCX, or TXT).
    
    This endpoint:
    - Accepts resume files (PDF, DOCX, TXT)
    - Extracts and parses resume content
    - Returns structured resume data
    - Generates a unique resume ID
    """
    try:
        user_uuid = UUID(user_id)
        user = get_user_by_id(db, user_uuid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Read file content
        file_content = await file.read()
        
        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Get filename
        filename = file.filename or "resume"
        
        extractor = UploadedFileTextService()
        extracted_text = extractor.extract_text(file_content, filename)

        print("Extracted text:", extracted_text[:500])

        parsed = parse_resume_text(extracted_text)
        print("Parsed JSON:", parsed)

        summary = parsed.get("summary") or parsed.get("personal", {}).get("summary")
        resume = create_resume(
            db,
            user_id=user_uuid,
            title=title or filename,
            summary=summary,
            status="draft",
            resume_json=parsed,
        )

        create_resume_version(
            db,
            resume=resume,
            content=parsed,
            source_text=extracted_text,
            change_summary="Imported uploaded resume file",
        )

        create_uploaded_file(
            db,
            user_id=user_uuid,
            resume_id=resume.id,
            filename=filename,
            content_type=file.content_type,
            extracted_text=extracted_text,
            metadata={"original_filename": filename},
        )

        db.commit()
        
        # Convert to schema
        parse_result = ResumeParseContent.model_validate(parsed)
        
        return ResumeUploadOut(
            parse_result=parse_result,
            resume_id=str(resume.id),
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Failed to parse resume file: {str(e)}"
        ) from e


@router.get("/resume/{resume_id}", response_model=ResumeOut)
def read_resume_compat(resume_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)) -> ResumeOut:
    resume = get_resume(db, resume_id=resume_id, user_id=user_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeOut.model_validate(resume)


@router.post("/resume/analyze-improve", response_model=ResumeAnalysisOut)
def analyze_and_improve_resume(
    payload: ResumeAnalysisIn,
) -> ResumeAnalysisOut:
    """
    Analyze uploaded resume and provide improvement suggestions.
    
    This endpoint:
    - Analyzes resume quality and structure
    - Identifies strengths and improvement areas
    - Generates specific, actionable suggestions
    - Optionally tailors suggestions to a target job description
    """
    try:
        analysis_service = ResumeAnalysisService()
        personal = payload.resume_content.personal

        experience = [
            " ".join(part for part in [item.title, item.company, item.description] if part).strip()
            for item in payload.resume_content.experience
        ]
        projects = [
            " ".join(part for part in [item.title, item.company, item.description, item.link] if part).strip()
            for item in payload.resume_content.projects
        ]
        education = [
            " ".join(part for part in [item.institution, item.degree, item.year, item.description] if part).strip()
            for item in payload.resume_content.education
        ]

        resume_dict = {
            "name": personal.name,
            "email": personal.email,
            "phone": personal.phone,
            "links": personal.links,
            "summary": payload.resume_content.summary or personal.summary,
            "experience": [item for item in experience if item],
            "projects": [item for item in projects if item],
            "skills": payload.resume_content.skills,
            "education": [item for item in education if item],
        }
        
        # Perform analysis
        analysis = analysis_service.analyze_and_improve(
            resume_dict,
            payload.target_job_description,
        )
        
        return ResumeAnalysisOut(
            overall_score=analysis["overall_score"],
            strength_areas=analysis["strength_areas"],
            improvement_areas=analysis["improvement_areas"],
            suggestions=[
                {
                    "section": s["section"],
                    "current_bullet": s.get("current_bullet"),
                    "suggestion": s["suggestion"],
                    "reason": s["reason"],
                    "impact": s["impact"],
                }
                for s in analysis["suggestions"]
            ],
            summary=analysis["summary"],
        )
    
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze resume: {str(e)}"
        ) from e
