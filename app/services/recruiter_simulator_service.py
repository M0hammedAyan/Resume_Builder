from __future__ import annotations

import json
import os
import re
from collections import Counter

import requests

VAGUE_PHRASES = {
    "responsible for",
    "worked on",
    "helped with",
    "involved in",
    "participated in",
    "various tasks",
    "assisted with",
}


def _extract_keywords(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-\+\.]{2,}", text.lower())
    stop = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "from",
        "this",
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
    return {token for token in tokens if token not in stop}


def _safe_json(raw_text: str) -> dict:
    try:
        parsed = json.loads(raw_text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw_text)
        if not match:
            return {}
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else {}
        except Exception:  # noqa: BLE001
            return {}


def _llm_feedback(resume_text: str, job_description: str) -> dict:
    base_url = os.getenv("CAREEROS_OLLAMA_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("CAREEROS_OLLAMA_MODEL", "mistral")

    prompt = (
        "You are a recruiter simulator. Return strict JSON only with keys: strengths, weaknesses, suggestions.\n"
        "Avoid hallucinations; use only the provided resume text and job description.\n"
        f"Resume:\n{resume_text}\n\n"
        f"Job Description:\n{job_description}\n"
    )

    response = requests.post(
        f"{base_url}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False, "format": "json", "options": {"temperature": 0}},
        timeout=60,
    )
    response.raise_for_status()
    return _safe_json(response.json().get("response", ""))


def simulate_recruiter_review(resume_text: str, job_description: str, use_llm: bool = False) -> dict:
    """Evaluate resume quality against a job description using rule-based and optional LLM review."""
    jd_keywords = _extract_keywords(job_description)
    resume_keywords = _extract_keywords(resume_text)

    keyword_match = (len(jd_keywords & resume_keywords) / len(jd_keywords) * 100) if jd_keywords else 0.0

    lower_resume = resume_text.lower()
    vague_hits = [phrase for phrase in VAGUE_PHRASES if phrase in lower_resume]
    quantified_count = len(re.findall(r"\b\d+(?:\.\d+)?%?\b", resume_text))

    lines = [line.strip(" -\t") for line in resume_text.splitlines() if line.strip()]
    normalized_lines = [re.sub(r"\s+", " ", line.lower()) for line in lines]
    line_counts = Counter(normalized_lines)
    repetition_count = sum(count - 1 for count in line_counts.values() if count > 1)

    quantified_ratio = min(100.0, (quantified_count / max(len(lines), 1)) * 100)
    vague_penalty = min(100.0, len(vague_hits) * 15.0)
    repetition_penalty = min(100.0, repetition_count * 20.0)

    score = max(0.0, min(100.0, 0.55 * keyword_match + 0.35 * quantified_ratio - 0.05 * vague_penalty - 0.05 * repetition_penalty))

    strengths = []
    weaknesses = []
    suggestions = []

    if keyword_match >= 65:
        strengths.append("Strong job-keyword alignment with the target role")
    elif keyword_match >= 40:
        strengths.append("Moderate keyword alignment with room to improve")
    else:
        weaknesses.append("Low keyword alignment with job requirements")
        suggestions.append("Add core job-description keywords naturally in relevant bullets")

    if quantified_count > 0:
        strengths.append("Includes quantified achievements that improve credibility")
    else:
        weaknesses.append("Lacks quantified achievements")
        suggestions.append("Add metrics, percentages, or scale to each major accomplishment")

    if vague_hits:
        weaknesses.append("Contains vague language that weakens impact")
        suggestions.append("Replace vague phrases with direct action verbs and outcomes")

    if repetition_count > 0:
        weaknesses.append("Repeated bullet phrasing detected")
        suggestions.append("Diversify sentence structure and avoid duplicate statements")

    if use_llm:
        try:
            llm = _llm_feedback(resume_text, job_description)
            strengths.extend([str(item) for item in llm.get("strengths", []) if str(item).strip()])
            weaknesses.extend([str(item) for item in llm.get("weaknesses", []) if str(item).strip()])
            suggestions.extend([str(item) for item in llm.get("suggestions", []) if str(item).strip()])
        except Exception:  # noqa: BLE001
            suggestions.append("LLM qualitative feedback unavailable; using rule-based analysis only")

    # De-duplicate while preserving order.
    strengths = list(dict.fromkeys(strengths))
    weaknesses = list(dict.fromkeys(weaknesses))
    suggestions = list(dict.fromkeys(suggestions))

    return {
        "score": round(score, 2),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
    }
