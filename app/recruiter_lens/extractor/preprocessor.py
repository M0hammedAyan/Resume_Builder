from __future__ import annotations

import re

from app.recruiter_lens.extractor.nlp import get_nlp

_SPECIAL_CHARS_RE = re.compile(r"[^\w\s\.,;:/@+\-()\[\]%]")
_WHITESPACE_RE = re.compile(r"\s+")


def preprocess_text(text: str) -> str:
    """Lowercase, remove noisy characters, and normalize whitespace."""
    lowered = text.lower()
    no_special = _SPECIAL_CHARS_RE.sub(" ", lowered)
    return _WHITESPACE_RE.sub(" ", no_special).strip()


def segment_sentences(text: str) -> list[str]:
    """Split text into sentences using spaCy."""
    if not text.strip():
        return []
    nlp = get_nlp()
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents if sent.text.strip()]
