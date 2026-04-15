from __future__ import annotations


class ScoringEngine:
    """Weighted score aggregation for recruiter-facing compatibility."""

    WEIGHTS = {
        "hard_skills": 0.50,
        "preferred_skills": 0.20,
        "experience": 0.20,
        "context": 0.10,
    }

    def final_score(
        self,
        hard_skills_match: float,
        preferred_skills_match: float,
        experience_match: float,
        context_match: float,
    ) -> float:
        score = (
            hard_skills_match * self.WEIGHTS["hard_skills"]
            + preferred_skills_match * self.WEIGHTS["preferred_skills"]
            + experience_match * self.WEIGHTS["experience"]
            + context_match * self.WEIGHTS["context"]
        )
        return round(max(0.0, min(100.0, score)), 2)
