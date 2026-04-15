from __future__ import annotations

import re

from app.recruiter_lens.extractor.preprocessor import preprocess_text, segment_sentences
from app.recruiter_lens.matcher.skill_normalizer import infer_skills_from_text, normalize_skills

REQUIRED_CUES = ("required", "must have", "minimum qualifications")
PREFERRED_CUES = ("preferred", "nice to have", "bonus")
EXPERIENCE_RE = re.compile(r"(\d+)\+?\s*(?:years?|yrs?)")
TOKEN_RE = re.compile(r"[a-z][a-z0-9\-\+\.]{2,}")

STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "your",
    "ability",
    "about",
    "work",
    "team",
    "years",
    "experience",
}


class JobDescriptionExtractor:
    """Parse JD into required/preferred skills, experience, and keywords."""

    def extract(self, jd_text: str) -> dict:
        lines = [line.strip() for line in jd_text.splitlines() if line.strip()]
        lower_lines = [line.lower() for line in lines]

        required_lines = [line for line, low in zip(lines, lower_lines, strict=False) if any(cue in low for cue in REQUIRED_CUES)]
        preferred_lines = [line for line, low in zip(lines, lower_lines, strict=False) if any(cue in low for cue in PREFERRED_CUES)]

        required_skills = normalize_skills(infer_skills_from_text("\n".join(required_lines) or jd_text))
        preferred_skills = normalize_skills(infer_skills_from_text("\n".join(preferred_lines)))

        if not required_skills:
            required_skills = normalize_skills(infer_skills_from_text(jd_text))

        exp_values = [int(match.group(1)) for match in EXPERIENCE_RE.finditer(jd_text.lower())]
        experience_required = max(exp_values) if exp_values else 0

        cleaned = preprocess_text(jd_text)
        tokens = [token for token in TOKEN_RE.findall(cleaned) if token not in STOPWORDS]
        keyword_counts: dict[str, int] = {}
        for token in tokens:
            keyword_counts[token] = keyword_counts.get(token, 0) + 1

        keywords = [k for k, _ in sorted(keyword_counts.items(), key=lambda item: item[1], reverse=True)[:20]]

        return {
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "experience_required_years": experience_required,
            "keywords": keywords,
            "sentences": segment_sentences(jd_text),
            "raw_text": jd_text,
        }
