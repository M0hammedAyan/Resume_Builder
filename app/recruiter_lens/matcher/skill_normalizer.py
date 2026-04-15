from __future__ import annotations

import re

SKILL_DICTIONARY: dict[str, str] = {
    "nlp": "natural language processing",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "sql": "structured query language",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "ci/cd": "continuous integration and continuous delivery",
}

CANONICAL_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "amazon web services",
    "google cloud platform",
    "azure",
    "machine learning",
    "natural language processing",
    "deep learning",
    "data analysis",
    "data visualization",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "git",
    "linux",
    "rest api",
    "microservices",
    "agile",
}



def normalize_skill(skill: str) -> str:
    raw = skill.strip().lower()
    mapped = SKILL_DICTIONARY.get(raw, raw)
    return re.sub(r"\s+", " ", mapped)



def normalize_skills(skills: list[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for skill in skills:
        candidate = normalize_skill(skill)
        if not candidate:
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        normalized.append(candidate)
    return normalized



def infer_skills_from_text(text: str) -> list[str]:
    lower = text.lower()
    inferred: list[str] = []

    for alias, canonical in SKILL_DICTIONARY.items():
        if re.search(rf"\b{re.escape(alias)}\b", lower) or re.search(rf"\b{re.escape(canonical)}\b", lower):
            inferred.append(canonical)

    for skill in CANONICAL_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", lower):
            inferred.append(skill)

    return normalize_skills(inferred)
