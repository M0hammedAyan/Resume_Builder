from __future__ import annotations

import re
from typing import Any

STOPWORDS = {
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

STRONG_ACTION_VERBS = {
    "built",
    "led",
    "improved",
    "designed",
    "implemented",
    "optimized",
    "delivered",
    "created",
    "launched",
    "reduced",
    "increased",
    "automated",
    "architected",
}


def _extract_keywords(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-\+\.]{2,}", text.lower())
    return {token for token in tokens if token not in STOPWORDS}


def _split_bullets(text: str) -> list[str]:
    lines = [line.strip(" -\t") for line in text.splitlines()]
    return [line for line in lines if line]


def _syllable_count(word: str) -> int:
    word = word.lower()
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def _flesch_score(text: str) -> float:
    sentences = re.split(r"[.!?]+", text)
    sentence_count = max(len([s for s in sentences if s.strip()]), 1)
    words = re.findall(r"[A-Za-z]+", text)
    word_count = max(len(words), 1)
    syllables = sum(_syllable_count(word) for word in words) or 1

    score = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllables / word_count)
    return max(0.0, min(100.0, score))


def evaluate_resume(text: str, job_description: str) -> dict[str, Any]:
    """Compute ATS-style evaluation metrics for generated resume bullets."""
    jd_keywords = _extract_keywords(job_description)
    resume_keywords = _extract_keywords(text)

    if jd_keywords:
        keyword_match_score = (len(jd_keywords & resume_keywords) / len(jd_keywords)) * 100
    else:
        keyword_match_score = 0.0

    bullets = _split_bullets(text)
    bullet_count = max(len(bullets), 1)

    quantified_count = sum(1 for bullet in bullets if re.search(r"\d", bullet))
    quantified_bullets_ratio = (quantified_count / bullet_count) * 100

    strong_verb_count = 0
    for bullet in bullets:
        first_word_match = re.match(r"([A-Za-z]+)", bullet.lower())
        if first_word_match and first_word_match.group(1) in STRONG_ACTION_VERBS:
            strong_verb_count += 1
    action_verb_strength = (strong_verb_count / bullet_count) * 100

    readability = _flesch_score(text)

    overall_score = (
        keyword_match_score * 0.35
        + quantified_bullets_ratio * 0.25
        + action_verb_strength * 0.20
        + readability * 0.20
    )

    return {
        "overall_score": round(max(0.0, min(100.0, overall_score)), 2),
        "breakdown": {
            "keyword_match_score": round(keyword_match_score, 2),
            "quantified_bullets_ratio": round(quantified_bullets_ratio, 2),
            "action_verb_strength": round(action_verb_strength, 2),
            "readability": round(readability, 2),
        },
    }
