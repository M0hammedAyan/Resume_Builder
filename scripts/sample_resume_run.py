from __future__ import annotations

from datetime import datetime, timezone

from app.db.repository import get_event_repository
from app.models.career_event import CareerEvent, ImpactModel
from app.services.evaluation_service import evaluate_resume
from app.services.ollama_service import ollama_service
from app.services.scoring_service import select_top_events


def sample_events() -> list[CareerEvent]:
    return [
        CareerEvent(
            event_id="evt_ml_001",
            timestamp=datetime(2025, 11, 10, tzinfo=timezone.utc),
            role_context="Machine Learning Engineer",
            action="Built a CNN model for manufacturing defect detection",
            tools=["Python", "PyTorch", "OpenCV"],
            domain="Computer Vision",
            impact=ImpactModel(metric="Defect detection accuracy", value=92.0, improvement="Improved accuracy by 18%"),
            evidence="Model evaluation report",
            confidence=0.93,
        ),
        CareerEvent(
            event_id="evt_ml_002",
            timestamp=datetime(2025, 8, 15, tzinfo=timezone.utc),
            role_context="ML Engineer",
            action="Developed an MLOps pipeline for model versioning and automated retraining",
            tools=["MLflow", "Docker", "FastAPI"],
            domain="MLOps",
            impact=ImpactModel(metric="Deployment cycle time", value=45.0, improvement="Reduced release cycle by 35%"),
            evidence="CI/CD pipeline dashboard",
            confidence=0.9,
        ),
        CareerEvent(
            event_id="evt_da_001",
            timestamp=datetime(2025, 6, 20, tzinfo=timezone.utc),
            role_context="Data Analyst",
            action="Created interactive sales dashboards and executive KPI reports",
            tools=["SQL", "Power BI", "Excel"],
            domain="Business Analytics",
            impact=ImpactModel(metric="Reporting time", value=6.0, improvement="Cut reporting cycle from 2 days to 6 hours"),
            evidence="Monthly business review decks",
            confidence=0.88,
        ),
        CareerEvent(
            event_id="evt_da_002",
            timestamp=datetime(2025, 4, 2, tzinfo=timezone.utc),
            role_context="Data Analyst",
            action="Built customer churn analysis and segmentation model for retention campaigns",
            tools=["Python", "Pandas", "Scikit-learn"],
            domain="Customer Analytics",
            impact=ImpactModel(metric="Retention rate", value=12.0, improvement="Increased retention by 12%"),
            evidence="Retention campaign outcomes",
            confidence=0.86,
        ),
        CareerEvent(
            event_id="evt_eng_001",
            timestamp=datetime(2024, 12, 14, tzinfo=timezone.utc),
            role_context="Software Engineer",
            action="Implemented event-driven APIs and async processing for high-volume data ingestion",
            tools=["Python", "FastAPI", "Redis"],
            domain="Backend Systems",
            impact=ImpactModel(metric="Throughput", value=3.5, improvement="Improved ingestion throughput by 3.5x"),
            evidence="Load test logs",
            confidence=0.84,
        ),
        CareerEvent(
            event_id="evt_nlp_001",
            timestamp=datetime(2025, 2, 5, tzinfo=timezone.utc),
            role_context="ML Engineer",
            action="Fine-tuned a transformer model for support ticket classification",
            tools=["Transformers", "Python", "Hugging Face"],
            domain="NLP",
            impact=ImpactModel(metric="Classification F1", value=0.91, improvement="Improved F1 by 14%"),
            evidence="Experiment tracking logs",
            confidence=0.89,
        ),
        CareerEvent(
            event_id="evt_data_001",
            timestamp=datetime(2024, 10, 18, tzinfo=timezone.utc),
            role_context="Data Analyst",
            action="Automated weekly ETL workflows for finance and operations reporting",
            tools=["SQL", "Airflow", "Python"],
            domain="Data Engineering",
            impact=ImpactModel(metric="Manual work hours", value=20.0, improvement="Saved 20 hours per week"),
            evidence="Ops runbook updates",
            confidence=0.85,
        ),
        CareerEvent(
            event_id="evt_exp_001",
            timestamp=datetime(2025, 1, 27, tzinfo=timezone.utc),
            role_context="Product Data Analyst",
            action="Designed and analyzed A/B tests for onboarding experiments",
            tools=["SQL", "Python", "Looker"],
            domain="Product Analytics",
            impact=ImpactModel(metric="Onboarding completion", value=9.0, improvement="Increased completion by 9%"),
            evidence="Experiment result memo",
            confidence=0.87,
        ),
    ]


def persist_samples(events: list[CareerEvent]) -> None:
    repo = get_event_repository()
    for event in events:
        repo.add_event(event)


def generate_for_role(role_name: str, job_description: str, events: list[CareerEvent], top_k: int = 5) -> dict:
    print(f"\n{'=' * 70}")
    print(f"Role: {role_name}")
    print(f"{'=' * 70}")

    selection = select_top_events(events, job_description, k=top_k)
    top_events = selection["top_events"]

    try:
        bullets = ollama_service.generate_resume_bullets(top_events)
    except Exception as exc:
        print(f"Ollama unavailable or failed ({exc}). Using deterministic fallback bullets.")
        bullets = [ollama_service._fallback_bullet(event) for event in top_events]

    resume_text = "\n".join(f"- {bullet}" for bullet in bullets)
    ats_scores = evaluate_resume(resume_text, job_description)

    print("\nSelected events:")
    for item in selection["scored_events"]:
        event_id = item["event_id"]
        total_score = item["total_score"]
        maybe_event = next((event for event in top_events if event.event_id == event_id), None)
        if maybe_event:
            print(f"- {event_id}: {maybe_event.action} | score={total_score}")

    print("\nGenerated bullets:")
    for bullet in bullets:
        print(f"- {bullet}")

    print("\nATS scores:")
    print(ats_scores)

    return {
        "role": role_name,
        "selected_event_ids": [event.event_id for event in top_events],
        "bullets": bullets,
        "ats_scores": ats_scores,
    }


def print_comparison(results: list[dict]) -> None:
    if len(results) < 2:
        return

    first, second = results[0], results[1]
    first_score = first["ats_scores"]["overall_score"]
    second_score = second["ats_scores"]["overall_score"]

    print(f"\n{'=' * 70}")
    print("Comparison summary")
    print(f"{'=' * 70}")
    print(f"{first['role']} overall ATS score: {first_score}")
    print(f"{second['role']} overall ATS score: {second_score}")

    overlap = sorted(set(first["selected_event_ids"]).intersection(second["selected_event_ids"]))
    unique_first = sorted(set(first["selected_event_ids"]) - set(second["selected_event_ids"]))
    unique_second = sorted(set(second["selected_event_ids"]) - set(first["selected_event_ids"]))

    print(f"Shared selected events: {overlap if overlap else 'None'}")
    print(f"Only in {first['role']}: {unique_first if unique_first else 'None'}")
    print(f"Only in {second['role']}: {unique_second if unique_second else 'None'}")


def main() -> None:
    events = sample_events()
    persist_samples(events)

    ml_job_description = (
        "Looking for an ML Engineer with experience in deep learning, model deployment, MLOps, "
        "computer vision, and production-grade Python systems."
    )
    data_analyst_job_description = (
        "Looking for a Data Analyst experienced with SQL, dashboards, KPI tracking, A/B testing, "
        "and communicating insights to business stakeholders."
    )

    results = [
        generate_for_role("ML Engineer", ml_job_description, events),
        generate_for_role("Data Analyst", data_analyst_job_description, events),
    ]

    print_comparison(results)


if __name__ == "__main__":
    main()
