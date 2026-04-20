from __future__ import annotations

import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from uuid import UUID

import requests
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.crud.storage import list_resume_versions
from app.models.resume import Resume
from app.recruiter_lens.matcher.skill_normalizer import infer_skills_from_text, normalize_skill
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


def _extract_resume_skills(resume_json: dict) -> set[str]:
    explicit = resume_json.get("skills")
    skills: list[str] = []

    if isinstance(explicit, list):
        skills.extend(str(item).strip() for item in explicit if str(item).strip())
    elif isinstance(explicit, str):
        skills.extend(part.strip() for part in re.split(r",|\n", explicit) if part.strip())

    text_parts: list[str] = []
    for section in ("experience", "projects"):
        entries = resume_json.get(section)
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if isinstance(entry, dict):
                text_parts.extend(
                    str(entry.get(field, "")).strip()
                    for field in ("title", "company", "description", "summary")
                    if str(entry.get(field, "")).strip()
                )
            elif isinstance(entry, str) and entry.strip():
                text_parts.append(entry.strip())

    inferred = infer_skills_from_text("\n".join(text_parts))
    for item in inferred:
        if item.strip():
            skills.append(item.strip())

    return {normalize_skill(skill) for skill in skills if skill}


def _label_strength(score: int) -> str:
    if score >= 75:
        return "Good"
    if score >= 60:
        return "Average"
    return "Weak"


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _as_list(value: object) -> list:
    return value if isinstance(value, list) else []


def _load_recruiter_analysis_rows(db: Session, user_id: UUID, resume_id: UUID) -> list[dict]:
        query = text(
                """
                SELECT score, analysis, missing_skills, suggestions, created_at
                FROM recruiter_analyses
                WHERE user_id = CAST(:user_id AS uuid)
                    AND resume_id = CAST(:resume_id AS uuid)
                ORDER BY created_at ASC
                """
        )

        rows = db.execute(query, {"user_id": str(user_id), "resume_id": str(resume_id)}).mappings().all()
        return [dict(row) for row in rows]


def generate_resume_insights_dashboard(db: Session, resume: Resume, user_id: UUID) -> dict:
    analyses = _load_recruiter_analysis_rows(db, user_id=user_id, resume_id=resume.id)

    versions = list_resume_versions(db, resume_id=resume.id)

    score_history: list[int] = []
    for analysis in analyses:
        value = analysis.get("score")
        analysis_payload = analysis.get("analysis") if isinstance(analysis.get("analysis"), dict) else {}
        if value is None and isinstance(analysis_payload, dict):
            raw = analysis_payload.get("score")
            if isinstance(raw, (int, float)):
                value = float(raw)
        if isinstance(value, (int, float)):
            score_history.append(int(round(value)))

    latest_score = score_history[-1] if score_history else 0

    latest_analysis = analyses[-1] if analyses else None
    latest_analysis_data = _as_dict(latest_analysis.get("analysis") if latest_analysis else None)
    latest_breakdown = _as_dict(latest_analysis_data.get("breakdown"))
    latest_metadata = _as_dict(latest_analysis_data.get("metadata"))

    jd_required = _as_list(latest_metadata.get("required_skills"))
    jd_skills = {normalize_skill(str(skill)) for skill in jd_required if str(skill).strip()}
    resume_skills = _extract_resume_skills(dict(resume.resume_json or {}))

    if jd_skills:
        matched = len(jd_skills & resume_skills)
        missing = len(jd_skills - resume_skills)
    else:
        missing_skills_latest = _as_list(latest_analysis.get("missing_skills") if latest_analysis else None)
        missing = len([skill for skill in missing_skills_latest if str(skill).strip()])
        matched = max(len(resume_skills) - missing, 0)

    missing_counter: Counter[str] = Counter()
    for analysis in analyses:
        missing_list = _as_list(analysis.get("missing_skills"))
        for skill in missing_list:
            normalized = str(skill).strip().lower()
            if normalized:
                missing_counter[normalized] += 1

    top_missing_skills = [skill.title() for skill, _ in missing_counter.most_common(8)]

    improvement_areas: list[str] = []
    if latest_score < 70:
        improvement_areas.append("skills")
    keyword_score = float(latest_breakdown.get("keywords", 0.0)) if isinstance(latest_breakdown.get("keywords", 0.0), (int, float)) else 0.0
    if keyword_score < 60:
        improvement_areas.append("keywords")
    experience_score = float(latest_breakdown.get("experience", 0.0)) if isinstance(latest_breakdown.get("experience", 0.0), (int, float)) else 0.0
    if experience_score < 70:
        improvement_areas.append("experience")
    if not improvement_areas and top_missing_skills:
        improvement_areas.append("hard_skills")

    recommendations: list[str] = []
    latest_suggestions = _as_list(latest_analysis.get("suggestions") if latest_analysis else None)
    recommendations.extend(str(item).strip() for item in latest_suggestions if str(item).strip())

    if top_missing_skills:
        recommendations.append(f"Prioritize adding evidence for: {', '.join(top_missing_skills[:3])}")
    if len(versions) <= 1:
        recommendations.append("Create a revised resume version after applying these updates")
    if len(score_history) >= 2 and score_history[-1] <= score_history[-2]:
        recommendations.append("Improve keyword alignment in your latest experience and project bullets")

    if not recommendations:
        recommendations.append("Run another Recruiter Lens analysis after refining experience bullets")

    recommendations = list(dict.fromkeys(recommendations))[:8]

    return {
        "latest_score": latest_score,
        "score_history": score_history,
        "skill_coverage": {
            "matched": int(matched),
            "missing": int(missing),
        },
        "top_missing_skills": top_missing_skills,
        "improvement_areas": improvement_areas,
        "resume_strength": _label_strength(latest_score),
        "recommendations": recommendations,
    }
