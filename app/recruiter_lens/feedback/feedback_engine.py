from __future__ import annotations

import re

GENERIC_PHRASES = ("worked on", "responsible for", "did", "helped", "assisted")
ACTION_REPLACEMENTS = {
    "worked on": "developed",
    "did": "implemented",
    "helped": "delivered",
    "responsible for": "owned",
    "assisted": "supported",
}


class FeedbackEngine:
    """Generate actionable feedback from scoring artifacts."""

    def build_feedback(
        self,
        missing_skills: list[str],
        experience_lines: list[str],
    ) -> list[str]:
        suggestions: list[str] = []

        if missing_skills:
            suggestions.append(f"Add or evidence these missing skills: {', '.join(missing_skills)}.")

        weak_lines = self._detect_weak_bullets(experience_lines)
        for line in weak_lines:
            rewrite = self._rewrite_star(line)
            suggestions.append(f"Weak bullet: '{line}'. STAR rewrite hint: {rewrite}")

        for line in experience_lines:
            lowered = line.lower()
            for bad, good in ACTION_REPLACEMENTS.items():
                if bad in lowered:
                    suggestions.append(f"Replace '{bad}' with stronger verb '{good}' in: '{line}'.")

        return list(dict.fromkeys(suggestions))

    def _detect_weak_bullets(self, lines: list[str]) -> list[str]:
        weak: list[str] = []
        for line in lines:
            compact = re.sub(r"\s+", " ", line.strip())
            if len(compact) < 45:
                weak.append(compact)
                continue
            if any(phrase in compact.lower() for phrase in GENERIC_PHRASES):
                weak.append(compact)
        return weak[:8]

    def _rewrite_star(self, line: str) -> str:
        return (
            "Situation/Task: describe context. "
            "Action: specify what you changed. "
            "Result: add a measurable metric (%, $, latency, scale)."
        )
