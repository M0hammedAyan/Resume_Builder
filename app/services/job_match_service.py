from __future__ import annotations

import re
from collections import Counter
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.structured_event import StructuredEvent
from app.services.retrieval_service import get_similar_events

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


def _extract_keywords(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-\+\.]{2,}", text.lower())
    return [token for token in tokens if token not in _STOPWORDS]


def _user_skill_tokens(events: list[StructuredEvent]) -> set[str]:
    pool: list[str] = []
    for event in events:
        pool.extend(_extract_keywords(event.action))
        pool.extend(_extract_keywords(event.domain or ""))
        for tool in event.tools or []:
            pool.extend(_extract_keywords(tool))
    return set(pool)


def run_job_match(db: Session, user_id: UUID, job_description: str) -> dict:
    events = db.query(StructuredEvent).filter(StructuredEvent.user_id == user_id).all()
    if not events:
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "recommended_actions": ["Add at least 3 career events before matching"],
        }

    jd_keywords_list = _extract_keywords(job_description)
    jd_counter = Counter(jd_keywords_list)
    jd_keywords = set(jd_keywords_list)
    user_tokens = _user_skill_tokens(events)

    matched = sorted(jd_keywords & user_tokens)
    missing = sorted(jd_keywords - user_tokens)

    keyword_coverage = (len(matched) / len(jd_keywords)) if jd_keywords else 0.0

    retrieval = get_similar_events(db, user_id=user_id, job_description=job_description, limit=25)
    similarities = [float(item.get("similarity", 0.0)) for item in retrieval["events"]]
    embedding_fit = max(0.0, min(1.0, (sum(similarities[:5]) / max(1, min(5, len(similarities)))))) if similarities else 0.0

    score = round(max(0.0, min(100.0, (0.6 * embedding_fit + 0.4 * keyword_coverage) * 100.0)))

    high_priority_missing = sorted(missing, key=lambda skill: jd_counter.get(skill, 0), reverse=True)[:5]
    actions = [f"Build evidence for {skill} in your next project" for skill in high_priority_missing]

    return {
        "match_score": score,
        "matched_skills": matched[:12],
        "missing_skills": missing[:12],
        "recommended_actions": actions or ["Refine keywords in your career events"],
    }
