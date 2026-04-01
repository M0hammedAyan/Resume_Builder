from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
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
)
from fastapi import UploadFile, File, Form
import uuid

from app.services.pipeline_service import run_vector_selection_pipeline
from app.services.resume_chat_service import ResumeChatService, JDAnalysisService
from app.services.resume_parsing_service import ResumeParsingService, ResumeAnalysisService
from app.schemas.resume_upload import (
    ResumeUploadOut,
    ResumeAnalysisIn,
    ResumeAnalysisOut,
    ResumeParseContent,
)

router = APIRouter(tags=["resume"])


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
def resume_chat(payload: ResumeChatIn) -> ResumeChatOut:
    """
    Process user input for resume building with AI assistance.
    
    This endpoint:
    - Takes user descriptions of achievements
    - Generates professional resume bullets
    - Asks follow-up questions to gather more details
    - Returns confidence score for the generated content
    """
    chat_service = ResumeChatService()
    result = chat_service.process_user_input(payload.user_input, payload.context)
    
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
        # Read file content
        file_content = await file.read()
        
        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Get filename
        filename = file.filename or "resume"
        
        # Parse resume
        parsing_service = ResumeParsingService()
        parsed = parsing_service.parse_uploaded_file(file_content, filename)
        
        # Create resume ID
        resume_id = str(uuid.uuid4())
        
        # Convert to schema
        parse_result = ResumeParseContent(
            name=parsed.get("name"),
            email=parsed.get("email"),
            phone=parsed.get("phone"),
            summary=parsed.get("summary"),
            experience=parsed.get("experience", []),
            projects=parsed.get("projects", []),
            skills=parsed.get("skills", []),
            education=parsed.get("education", []),
            raw_text=parsed.get("raw_text", ""),
        )
        
        return ResumeUploadOut(
            parse_result=parse_result,
            resume_id=resume_id,
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Failed to parse resume file: {str(e)}"
        ) from e


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
        
        # Convert payload to dict for analysis
        resume_dict = {
            "name": payload.resume_content.name,
            "email": payload.resume_content.email,
            "phone": payload.resume_content.phone,
            "summary": payload.resume_content.summary,
            "experience": payload.resume_content.experience,
            "projects": payload.resume_content.projects,
            "skills": payload.resume_content.skills,
            "education": payload.resume_content.education,
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
