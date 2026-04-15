from __future__ import annotations

from functools import lru_cache

import spacy


@lru_cache(maxsize=1)
def get_nlp():
    """Return a spaCy pipeline with sentence segmentation enabled."""
    for model_name in ("en_core_web_md", "en_core_web_sm"):
        try:
            return spacy.load(model_name)
        except Exception:  # noqa: BLE001
            continue

    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")
    return nlp
