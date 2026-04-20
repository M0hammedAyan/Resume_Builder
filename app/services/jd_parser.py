from __future__ import annotations

import re

from app.recruiter_lens.matcher.skill_normalizer import infer_skills_from_text, normalize_skills

_REQUIRED_CUES = (
    "required",
    "must have",
    "minimum qualifications",
    "basic qualifications",
)
_PREFERRED_CUES = (
    "preferred",
    "nice to have",
    "bonus",
    "plus",
)
_EXPERIENCE_RE = re.compile(r"(\d+)\+?\s*(?:years?|yrs?)", re.IGNORECASE)
_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9\-\+\.]{2,}")
_REQUIRED_BLOCK_RE = re.compile(
    r"(?:required|must\s*have|minimum\s*qualifications|basic\s*qualifications)\s*:?\s*(.+?)(?=(?:preferred|nice\s*to\s*have|bonus|plus)\s*:|$)",
    re.IGNORECASE | re.DOTALL,
)
_PREFERRED_BLOCK_RE = re.compile(
    r"(?:preferred|nice\s*to\s*have|bonus|plus)\s*:?\s*(.+?)(?=$)",
    re.IGNORECASE | re.DOTALL,
)

_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "your",
    "you",
    "our",
    "role",
    "will",
    "have",
    "has",
    "are",
    "from",
    "into",
    "using",
    "ability",
    "experience",
    "years",
    "team",
    "work",
}


def _extract_keywords(text: str, limit: int = 25) -> list[str]:
    counts: dict[str, int] = {}
    for token in _TOKEN_RE.findall(text.lower()):
        if token in _STOPWORDS:
            continue
        counts[token] = counts.get(token, 0) + 1

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    return [token for token, _ in ranked[:limit]]


def parse_job_description(job_description: str) -> dict[str, object]:
    cleaned = (job_description or "").strip()
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]

    required_block_match = _REQUIRED_BLOCK_RE.search(cleaned)
    preferred_block_match = _PREFERRED_BLOCK_RE.search(cleaned)

    required_block = required_block_match.group(1).strip() if required_block_match else ""
    preferred_block = preferred_block_match.group(1).strip() if preferred_block_match else ""

    required_lines: list[str] = []
    preferred_lines: list[str] = []

    for line in lines:
        low = line.lower()
        if any(cue in low for cue in _REQUIRED_CUES):
            required_lines.append(line)
        if any(cue in low for cue in _PREFERRED_CUES):
            preferred_lines.append(line)

    if not required_block:
        required_block = "\n".join(required_lines) if required_lines else cleaned

    if not preferred_block:
        preferred_block = "\n".join(preferred_lines)

    required_skills = normalize_skills(infer_skills_from_text(required_block))
    preferred_skills = normalize_skills(infer_skills_from_text(preferred_block))

    if preferred_skills:
        preferred_set = set(preferred_skills)
        required_skills = [skill for skill in required_skills if skill not in preferred_set]

    exp_hits = [int(match.group(1)) for match in _EXPERIENCE_RE.finditer(cleaned)]
    years_required = max(exp_hits) if exp_hits else 0

    keywords = _extract_keywords(cleaned)

    return {
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "years_required": years_required,
        # Backward compatibility for existing consumers.
        "experience_years": years_required,
        "keywords": keywords,
    }
