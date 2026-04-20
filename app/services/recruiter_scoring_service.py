from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.recruiter_lens.matcher.skill_normalizer import infer_skills_from_text, normalize_skill, normalize_skills
from app.services.ai_router import route_ai_task
from app.services.embedding_service import cosine_similarity, get_embedding
from app.services.jd_parser import parse_job_description

logger = logging.getLogger(__name__)

_YEAR_RE = re.compile(r"(\d+)\+?\s*(?:years?|yrs?)", re.IGNORECASE)
_RANGE_RE = re.compile(r"(20\d{2})\s*[-to]{1,3}\s*(20\d{2}|present|current)", re.IGNORECASE)
_WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9\-\+\.]{2,}")

SYNONYMS = {
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "nlp": "natural language processing",
}


def normalize(skills: list[str]) -> set[str]:
    normalized: set[str] = set()
    for raw in skills:
        item = str(raw).lower().strip()
        if not item:
            continue
        item = SYNONYMS.get(item, item)
        normalized.add(normalize_skill(item))
    return normalized


def match_skills(jd: list[str], resume: list[str]) -> tuple[float, list[str], list[str]]:
    jd_set = normalize(jd)
    res_set = normalize(resume)

    matched = sorted(jd_set & res_set)
    missing = sorted(jd_set - res_set)

    score = (len(matched) / len(jd_set) * 100.0) if jd_set else 0.0
    return score, matched, missing


def final_score(hard: float, pref: float, exp: float, keyword: float) -> int:
    return round(0.5 * hard + 0.2 * pref + 0.15 * exp + 0.15 * keyword)


def _stringify_resume_sections(resume_json: dict[str, Any]) -> str:
    parts: list[str] = []

    personal = resume_json.get("personal")
    if isinstance(personal, dict):
        for key in ("summary", "headline", "name"):
            value = str(personal.get(key, "")).strip()
            if value:
                parts.append(value)

    for section in ("experience", "projects", "education"):
        entries = resume_json.get(section)
        if not isinstance(entries, list):
            continue
        for item in entries:
            if isinstance(item, dict):
                parts.extend(
                    str(item.get(field, "")).strip()
                    for field in ("title", "company", "institution", "degree", "description", "summary")
                    if str(item.get(field, "")).strip()
                )
            elif isinstance(item, str):
                text = item.strip()
                if text:
                    parts.append(text)

    skills = resume_json.get("skills")
    if isinstance(skills, list):
        parts.extend(str(skill).strip() for skill in skills if str(skill).strip())
    elif isinstance(skills, str) and skills.strip():
        parts.append(skills.strip())

    return "\n".join(parts)


def _extract_resume_data(resume_json: dict[str, Any]) -> dict[str, Any]:
    explicit_skills = resume_json.get("skills", [])
    normalized_explicit: list[str] = []

    if isinstance(explicit_skills, list):
        normalized_explicit = normalize_skills([str(skill) for skill in explicit_skills if str(skill).strip()])
    elif isinstance(explicit_skills, str):
        split_skills = [item.strip() for item in re.split(r",|\n", explicit_skills) if item.strip()]
        normalized_explicit = normalize_skills(split_skills)

    experience = resume_json.get("experience") if isinstance(resume_json.get("experience"), list) else []
    projects = resume_json.get("projects") if isinstance(resume_json.get("projects"), list) else []

    experience_texts: list[str] = []
    for item in experience:
        if isinstance(item, dict):
            text = " ".join(
                str(item.get(field, "")).strip()
                for field in ("title", "company", "duration", "description")
                if str(item.get(field, "")).strip()
            )
            if text:
                experience_texts.append(text)
        elif isinstance(item, str) and item.strip():
            experience_texts.append(item.strip())

    project_texts: list[str] = []
    for item in projects:
        if isinstance(item, dict):
            text = " ".join(
                str(item.get(field, "")).strip()
                for field in ("title", "duration", "description")
                if str(item.get(field, "")).strip()
            )
            if text:
                project_texts.append(text)
        elif isinstance(item, str) and item.strip():
            project_texts.append(item.strip())

    inferred_from_text = infer_skills_from_text("\n".join(experience_texts + project_texts))
    combined_skills = normalize_skills(normalized_explicit + inferred_from_text)

    return {
        "skills": combined_skills,
        "experience_texts": experience_texts,
        "project_texts": project_texts,
    }


def _estimate_resume_years(experience_texts: list[str], project_texts: list[str]) -> int:
    text = "\n".join(experience_texts + project_texts)
    years_found = [int(match.group(1)) for match in _YEAR_RE.finditer(text)]

    span_years: list[int] = []
    for match in _RANGE_RE.finditer(text.lower()):
        start = int(match.group(1))
        end_raw = match.group(2)
        end = 2026 if end_raw in {"present", "current"} else int(end_raw)
        if end >= start:
            span_years.append(end - start)

    candidates = years_found + span_years
    return max(candidates) if candidates else 0


def _keyword_match(jd_keywords: list[str], resume_text: str) -> float:
    if not jd_keywords:
        return 0.0

    tokens = {token.lower() for token in _WORD_RE.findall(resume_text.lower())}
    matched = sum(1 for keyword in jd_keywords if keyword.lower() in tokens)
    return (matched / len(jd_keywords)) * 100.0


def _semantic_similarity_embedding(jd_text: str, resume_text: str) -> float:
    try:
        jd_vec = get_embedding(jd_text)
        resume_vec = get_embedding(resume_text)
        sim = cosine_similarity(jd_vec, resume_vec)
        return max(0.0, min(100.0, sim * 100.0))
    except Exception:  # noqa: BLE001
        return 0.0


def _semantic_similarity_gemini(jd_text: str, resume_text: str) -> float:
    prompt = f"""
Compare resume and job description.

Return JSON only:
{{
  "similarity": 0
}}

Rules:
- similarity must be a number between 0 and 100
- no explanation text

JD:
{jd_text}

Resume:
{resume_text}
"""
    try:
        raw = route_ai_task(task_type="analysis", prompt=prompt)
        parsed = _parse_json_with_retry(raw)
        if not parsed:
            raise ValueError("invalid semantic json")
        value = float(parsed.get("similarity", 0.0))
        return max(0.0, min(100.0, value))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini semantic similarity unavailable: %s", exc)
        return _semantic_similarity_embedding(jd_text, resume_text)


def _parse_json_with_retry(raw: str) -> dict | None:
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else None
    except Exception:  # noqa: BLE001
        try:
            cleaned = raw.strip().replace("```json", "").replace("```", "")
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except Exception:  # noqa: BLE001
            return None


def _gemini_suggestions(job_description: str, resume_text: str, missing_skills: list[str]) -> list[str]:
    prompt = f"""
Analyze resume vs job description.

Job Description:
{job_description}

Resume:
{resume_text}

Provide JSON only:
{{
  "missing_keywords": [],
  "suggestions": [],
  "stronger_phrasing": []
}}

Rules:
- No hallucination
- Be concise
- Use only given inputs
"""
    try:
        raw = route_ai_task(task_type="jd_matching", prompt=prompt)
        parsed = _parse_json_with_retry(raw)
        if not parsed:
            raise ValueError("invalid ai json")

        suggestions: list[str] = []
        for key in ("missing_keywords", "suggestions", "stronger_phrasing"):
            value = parsed.get(key)
            if isinstance(value, list):
                suggestions.extend(str(item).strip() for item in value if str(item).strip())

        suggestions = list(dict.fromkeys(suggestions))
        return suggestions[:8]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini suggestions unavailable: %s", exc)

    fallback: list[str] = []
    if missing_skills:
        fallback.append(f"Add evidence for missing skills: {', '.join(missing_skills[:5])}")
    fallback.append("Use strong action verbs and quantify outcomes with numbers")
    fallback.append("Mirror critical JD keywords in experience and project bullets")
    return fallback[:5]


def scoring_pipeline(resume_json: dict[str, Any], job_description: str) -> dict[str, Any]:
    jd = parse_job_description(job_description)
    resume = _extract_resume_data(resume_json)
    resume_text = _stringify_resume_sections(resume_json)

    hard_score, matched_required, missing_required = match_skills(
        jd=[str(skill) for skill in jd.get("required_skills", [])],
        resume=[str(skill) for skill in resume["skills"]],
    )

    preferred_score, matched_preferred, missing_preferred = match_skills(
        jd=[str(skill) for skill in jd.get("preferred_skills", [])],
        resume=[str(skill) for skill in resume["skills"]],
    )

    required_years = int(jd.get("years_required", jd.get("experience_years", 0)) or 0)
    resume_years = _estimate_resume_years(resume["experience_texts"], resume["project_texts"])
    if required_years <= 0:
        experience_score = 100.0 if resume_years > 0 else 0.0
    else:
        experience_score = min(100.0, (resume_years / required_years) * 100.0)

    keyword_score = _keyword_match([str(k) for k in jd.get("keywords", [])], resume_text)
    semantic_similarity = _semantic_similarity_gemini(job_description, resume_text)

    score = final_score(hard_score, preferred_score, experience_score, keyword_score)
    missing_skills = sorted(set(missing_required + missing_preferred))
    matched_skills = sorted(set(matched_required + matched_preferred))

    improvement_areas: list[str] = []
    if hard_score < 70:
        improvement_areas.append("hard_skills")
    if preferred_score < 60:
        improvement_areas.append("preferred_skills")
    if experience_score < 70:
        improvement_areas.append("experience")
    if keyword_score < 65:
        improvement_areas.append("keywords")

    confidence = round(max(0.0, min(1.0, 0.7 * (score / 100.0) + 0.3 * (semantic_similarity / 100.0))), 2)

    suggestions = _gemini_suggestions(job_description, resume_text, missing_skills)
    if missing_skills:
        suggestions = [f"Add evidence for missing skills: {', '.join(missing_skills[:5])}"] + suggestions
    suggestions = list(dict.fromkeys(suggestions))[:8]

    return {
        "score": score,
        "confidence": confidence,
        "breakdown": {
            "hard_skills": round(hard_score, 2),
            "preferred_skills": round(preferred_score, 2),
            "experience": round(experience_score, 2),
            "keywords": round(keyword_score, 2),
        },
        "missing_skills": missing_skills,
        "matched_skills": matched_skills,
        "improvement_areas": improvement_areas,
        "suggestions": suggestions,
        "metadata": {
            "required_skills": jd.get("required_skills", []),
            "preferred_skills": jd.get("preferred_skills", []),
            "required_experience_years": required_years,
            "estimated_resume_years": resume_years,
            "semantic_similarity": round(semantic_similarity, 2),
        },
    }
