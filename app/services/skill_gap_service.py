from __future__ import annotations

import re
from collections import Counter
from uuid import UUID

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


def _extract_keywords(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-\+\.]{2,}", text.lower())
    return [token for token in tokens if token not in _STOPWORDS]


def analyze_skill_gap(db: Session, user_id: UUID, job_description: str) -> dict:
    events = db.query(StructuredEvent).filter(StructuredEvent.user_id == user_id).all()

    jd_keywords = _extract_keywords(job_description)
    jd_counter = Counter(jd_keywords)

    user_skills: list[str] = []
    for event in events:
        user_skills.extend(_extract_keywords(event.action))
        user_skills.extend(_extract_keywords(event.domain or ""))
        for tool in event.tools or []:
            user_skills.extend(_extract_keywords(tool))

    user_skill_set = set(user_skills)
    missing = sorted(set(jd_keywords) - user_skill_set)

    ranking = []
    for index, skill in enumerate(sorted(missing, key=lambda key: jd_counter.get(key, 0), reverse=True), start=1):
        ranking.append(
            {
                "skill": skill,
                "priority": index,
                "reason": "High relevance to target role" if jd_counter.get(skill, 0) >= 2 else "Missing baseline signal",
            }
        )

    return {
        "missing_skills": [item["skill"] for item in ranking],
        "priority_ranking": ranking,
    }
