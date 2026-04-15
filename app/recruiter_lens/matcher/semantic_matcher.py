from __future__ import annotations

import math

from app.recruiter_lens.extractor.preprocessor import preprocess_text

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # noqa: BLE001
    SentenceTransformer = None


class SemanticMatcher:
    """Embedding-powered semantic similarity matching with lexical fallback."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self.model = None

    def match_skills(
        self,
        resume_skills: list[str],
        jd_skills: list[str],
        threshold: float = 0.55,
    ) -> tuple[float, list[dict], list[str]]:
        if not jd_skills:
            return 100.0, [], []

        pairs: list[dict] = []
        missing: list[str] = []

        for jd_skill in jd_skills:
            best_match = ""
            best_score = 0.0
            for resume_skill in resume_skills:
                score = self.semantic_similarity(resume_skill, jd_skill)
                if score > best_score:
                    best_score = score
                    best_match = resume_skill

            if best_score >= threshold:
                pairs.append(
                    {
                        "jd_skill": jd_skill,
                        "resume_skill": best_match,
                        "similarity": round(best_score, 4),
                    }
                )
            else:
                missing.append(jd_skill)

        coverage = (len(pairs) / len(jd_skills)) * 100
        return round(coverage, 2), pairs, missing

    def semantic_similarity(self, left: str, right: str) -> float:
        self._ensure_model()
        if self.model is None:
            return self._lexical_similarity(left, right)

        vectors = self.model.encode([left, right], normalize_embeddings=True)
        return max(0.0, min(1.0, float(vectors[0] @ vectors[1])))

    def keyword_context_similarity(self, resume_text: str, jd_text: str) -> float:
        if not resume_text.strip() or not jd_text.strip():
            return 0.0

        self._ensure_model()
        if self.model is None:
            return self._lexical_similarity(resume_text, jd_text)

        vectors = self.model.encode([resume_text, jd_text], normalize_embeddings=True)
        return max(0.0, min(1.0, float(vectors[0] @ vectors[1])))

    def _lexical_similarity(self, left: str, right: str) -> float:
        left_tokens = set(preprocess_text(left).split())
        right_tokens = set(preprocess_text(right).split())
        if not left_tokens or not right_tokens:
            return 0.0
        overlap = len(left_tokens & right_tokens)
        denom = math.sqrt(len(left_tokens) * len(right_tokens))
        return overlap / denom if denom else 0.0

    def _ensure_model(self) -> None:
        if self.model is not None or SentenceTransformer is None:
            return
        try:
            self.model = SentenceTransformer(self.model_name)
        except Exception:  # noqa: BLE001
            self.model = None
