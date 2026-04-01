from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.event_score import EventScore
from app.models.generated_output import GeneratedOutput
from app.services.decision_service import log_decisions
from app.services.evaluation_service import evaluate_resume
from app.services.feedback_service import get_user_weights
from app.services.generation_service import generate_resume_bullets
from app.services.personalization_service import get_or_create_personalization
from app.services.retrieval_service import get_similar_events
from app.services.selection_service import select_events
from app.services.user_service import ensure_user_exists


def run_vector_selection_pipeline(db: Session, user_id: UUID, job_description: str, k: int = 5) -> dict:
    """Run retrieval -> scoring -> selection -> generation -> evaluation and persist artifacts."""
    ensure_user_exists(db, user_id)

    retrieval = get_similar_events(db, job_description=job_description, user_id=user_id, limit=20)
    weights = get_user_weights(db, user_id)
    personalization = get_or_create_personalization(db, user_id)
    selection = select_events(retrieval["events"], job_embedding=retrieval["job_embedding"], k=k, weights=weights)

    # Cache score breakdowns for each event and job.
    for row in selection["scores"]:
        existing = (
            db.query(EventScore)
            .filter(EventScore.event_id == row["event_id"], EventScore.job_hash == retrieval["job_hash"])
            .first()
        )
        breakdown = row["breakdown"]
        if existing:
            existing.relevance = float(breakdown["relevance"])
            existing.impact = float(breakdown["impact"])
            existing.recency = float(breakdown["recency"])
            existing.confidence = float(breakdown["confidence"])
            existing.total_score = float(row["score"])
        else:
            db.add(
                EventScore(
                    event_id=row["event_id"],
                    job_hash=retrieval["job_hash"],
                    relevance=float(breakdown["relevance"]),
                    impact=float(breakdown["impact"]),
                    recency=float(breakdown["recency"]),
                    confidence=float(breakdown["confidence"]),
                    total_score=float(row["score"]),
                )
            )
    db.commit()

    log_decisions(db, job_hash=retrieval["job_hash"], explanations=selection["explanations"])

    selected_events = selection["selected_events"]
    bullets = generate_resume_bullets(
        selected_events,
        job_description,
        resume_tone=personalization["resume_tone"],
        detail_level=personalization["detail_level"],
    )
    resume_text = "\n".join(f"- {bullet}" for bullet in bullets)
    evaluation = evaluate_resume(resume_text, job_description)

    db.add(
        GeneratedOutput(
            user_id=user_id,
            job_description=job_description,
            output_type="resume",
            content={
                "selected_events": selected_events,
                "scores": selection["scores"],
                "explanations": selection["explanations"],
                "bullets": bullets,
                "evaluation": evaluation,
            },
            ats_score=float(evaluation["overall_score"]),
        )
    )
    db.commit()

    return {
        "selected_events": selected_events,
        "scores": selection["scores"],
        "explanations": selection["explanations"],
        "bullets": bullets,
        "evaluation": evaluation,
        "weights": weights,
        "personalization": personalization,
        "job_hash": retrieval["job_hash"],
    }
