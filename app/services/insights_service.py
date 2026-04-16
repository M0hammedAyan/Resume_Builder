from __future__ import annotations

import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from uuid import UUID

import requests
from sqlalchemy.orm import Session

from app.models.structured_event import StructuredEvent

_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "have",
    "are",
    "was",
    "were",
    "will",
    "about",
    "you",
}


def _extract_tokens(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-\+\.]{2,}", text.lower())
    return {token for token in tokens if token not in _STOPWORDS}


def _llm_recommendations(payload: dict) -> list[str]:
    base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")
    prompt = (
        "You are a career coach. Return strict JSON: {\"recommendations\": [\"...\"]}.\n"
        "Keep recommendations short, practical, and based only on the input.\n"
        f"Input: {json.dumps(payload)}"
    )
    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0}},
            timeout=45,
        )
        response.raise_for_status()
        parsed = json.loads(response.json().get("response", "{}"))
        recs = parsed.get("recommendations", []) if isinstance(parsed, dict) else []
        return [str(item).strip() for item in recs if str(item).strip()][:5]
    except Exception:
        return []


def generate_career_insights(db: Session, user_id: UUID, use_llm: bool = False) -> dict:
    events = (
        db.query(StructuredEvent)
        .filter(StructuredEvent.user_id == user_id)
        .order_by(StructuredEvent.timestamp.asc())
        .all()
    )

    if not events:
        return {
            "growth_trend": "stagnant",
            "strength_areas": [],
            "weak_areas": ["Deployment", "System Design"],
            "recommendations": [
                "Add measurable impact to projects",
                "Gain experience in production systems",
            ],
        }

    now = datetime.now(timezone.utc)
    recent = [event for event in events if (now - event.timestamp).days <= 180]
    older = [event for event in events if 180 < (now - event.timestamp).days <= 360]
    growth_trend = "increasing" if len(recent) >= max(2, len(older)) else "stagnant"

    domain_counter = Counter(event.domain for event in events if event.domain)
    tool_counter = Counter(tool for event in events for tool in (event.tools or []))

    strengths = [item for item, count in (domain_counter + tool_counter).most_common(5) if count >= 2]
    if not strengths:
        strengths = [item for item, _ in (domain_counter + tool_counter).most_common(2)]

    signals = " ".join(
        [event.action for event in events]
        + [event.domain for event in events if event.domain]
        + [tool for event in events for tool in (event.tools or [])]
    ).lower()

    capability_checks = {
        "Deployment": {"deployment", "mlops", "docker", "kubernetes", "release"},
        "System Design": {"architecture", "distributed", "scalable", "system"},
        "Leadership": {"led", "mentored", "managed", "ownership"},
        "Data Storytelling": {"dashboard", "stakeholder", "presentation", "insight"},
    }

    weak_areas = []
    for area, keywords in capability_checks.items():
        if not any(keyword in signals for keyword in keywords):
            weak_areas.append(area)

    if not weak_areas:
        weak_areas = ["System Design"]

    recommendations = []
    if all(not event.impact_metric.strip() for event in events):
        recommendations.append("Add measurable impact to projects")
    if "Deployment" in weak_areas:
        recommendations.append("Gain experience in production systems")
    if "Leadership" in weak_areas:
        recommendations.append("Lead one cross-functional initiative and document outcomes")

    recommendations = recommendations or ["Expand project scope and quantify outcomes weekly"]

    if use_llm:
        llm_recs = _llm_recommendations(
            {
                "growth_trend": growth_trend,
                "strength_areas": strengths,
                "weak_areas": weak_areas,
                "recommendations": recommendations,
            }
        )
        if llm_recs:
            recommendations = llm_recs

    return {
        "growth_trend": growth_trend,
        "strength_areas": strengths,
        "weak_areas": weak_areas,
        "recommendations": recommendations,
    }


def analyze_resume_data_insights(resume_data: dict, use_llm: bool = True) -> dict:
    raw_personal = resume_data.get("personal")
    personal: dict = raw_personal if isinstance(raw_personal, dict) else {}

    summary = str(resume_data.get("summary") or "")
    skills = [str(item).strip() for item in (resume_data.get("skills") or []) if str(item).strip()]
    experience = [str(item).strip() for item in (resume_data.get("experience") or []) if str(item).strip()]
    projects = [str(item).strip() for item in (resume_data.get("projects") or []) if str(item).strip()]
    education = [str(item).strip() for item in (resume_data.get("education") or []) if str(item).strip()]
    achievements = [str(item).strip() for item in (resume_data.get("achievements") or []) if str(item).strip()]

    skill_distribution = Counter(skills)

    strengths: list[str] = []
    weak_areas: list[str] = []

    if len(skills) >= 8:
        strengths.append("Broad skill coverage")
    else:
        weak_areas.append("Expand technical skills")

    quantified_entries = sum(1 for item in (experience + projects + achievements) if re.search(r"\b\d+(?:\.\d+)?%?\b", item))
    if quantified_entries >= 2:
        strengths.append("Quantified impact in achievements")
    else:
        weak_areas.append("Add measurable outcomes")

    if summary and len(summary.split()) >= 20:
        strengths.append("Clear professional summary")
    else:
        weak_areas.append("Improve professional summary")

    if education:
        strengths.append("Education section present")
    else:
        weak_areas.append("Add education details")

    experience_level = min(100, max(0, int(len(experience) * 15 + len(projects) * 10 + quantified_entries * 10)))
    resume_score = min(
        100,
        max(
            0,
            int(
                (15 if personal.get("name") else 0)
                + (10 if personal.get("email") else 0)
                + (10 if personal.get("phone") else 0)
                + (15 if summary else 0)
                + min(20, len(skills) * 2)
                + min(20, len(experience) * 5)
                + min(10, len(projects) * 5)
            ),
        ),
    )

    recommendations = []
    if "Expand technical skills" in weak_areas:
        recommendations.append("Add role-relevant tools and frameworks to the skills section")
    if "Add measurable outcomes" in weak_areas:
        recommendations.append("Include metrics in experience and project bullets")
    if "Improve professional summary" in weak_areas:
        recommendations.append("Rewrite summary to highlight domain focus and recent impact")
    if "Add education details" in weak_areas:
        recommendations.append("Include degree, institution, and graduation timeline")

    if use_llm:
        llm_recs = _llm_recommendations(
            {
                "summary": summary,
                "skills": skills,
                "experience": experience,
                "projects": projects,
                "education": education,
                "achievements": achievements,
                "strength_areas": strengths,
                "weak_areas": weak_areas,
                "recommendations": recommendations,
            }
        )
        if llm_recs:
            recommendations = llm_recs

    return {
        "skill_distribution": dict(skill_distribution),
        "strength_areas": strengths,
        "weak_areas": weak_areas,
        "experience_level": experience_level,
        "resume_score": resume_score,
        "recommendations": recommendations,
    }
