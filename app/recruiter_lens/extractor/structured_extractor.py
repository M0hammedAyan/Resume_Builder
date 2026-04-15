from __future__ import annotations

import re
from collections import defaultdict

from app.recruiter_lens.extractor.nlp import get_nlp
from app.recruiter_lens.matcher.skill_normalizer import infer_skills_from_text, normalize_skills

EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{3}\)?[\s\-.]?)\d{3}[\s\-.]?\d{4}")
URL_RE = re.compile(r"(?:https?://|www\.)[^\s]+")

SECTION_HEADERS = {
    "experience": {"experience", "professional experience", "work experience", "employment"},
    "education": {"education", "certifications", "academic background"},
    "skills": {"skills", "technical skills", "core competencies"},
    "projects": {"projects", "personal projects", "selected projects"},
}


class StructuredResumeExtractor:
    """Extract structured resume fields using regex, sections, and NER."""

    def __init__(self) -> None:
        self.nlp = get_nlp()

    def extract(self, text: str) -> dict:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        grouped = self._group_by_section(lines)

        doc = self.nlp(text)
        people = [ent.text.strip() for ent in doc.ents if ent.label_ == "PERSON" and 2 < len(ent.text.strip()) < 60]

        top_block = "\n".join(lines[:8])
        skills = self._extract_skills(grouped.get("skills", []), text)

        return {
            "name": people[0] if people else self._extract_name_from_top(lines),
            "email": self._first_match(EMAIL_RE, text),
            "phone": self._first_match(PHONE_RE, text),
            "links": URL_RE.findall(top_block),
            "education": grouped.get("education", []),
            "experience": grouped.get("experience", []),
            "skills": skills,
            "projects": grouped.get("projects", []),
            "entities": {
                "organizations": [ent.text for ent in doc.ents if ent.label_ == "ORG"],
                "dates": [ent.text for ent in doc.ents if ent.label_ == "DATE"],
            },
        }

    def _group_by_section(self, lines: list[str]) -> dict[str, list[str]]:
        sections: dict[str, list[str]] = defaultdict(list)
        current = "experience"

        for line in lines:
            maybe_header = self._detect_header(line)
            if maybe_header:
                current = maybe_header
                continue
            sections[current].append(line)

        for key in ["experience", "education", "skills", "projects"]:
            sections.setdefault(key, [])

        return dict(sections)

    def _detect_header(self, line: str) -> str | None:
        normalized = re.sub(r"[^a-z ]", "", line.lower()).strip()
        for section, headers in SECTION_HEADERS.items():
            if normalized in headers:
                return section
        return None

    def _extract_name_from_top(self, lines: list[str]) -> str:
        if not lines:
            return ""
        first = re.sub(r"[^a-zA-Z\s\-\.]", "", lines[0]).strip()
        return first if 2 < len(first) < 60 else ""

    def _extract_skills(self, skill_lines: list[str], full_text: str) -> list[str]:
        extracted: list[str] = []
        for line in skill_lines:
            parts = re.split(r"[,|/]", line)
            extracted.extend(part.strip() for part in parts if part.strip())

        extracted.extend(infer_skills_from_text(full_text))
        return normalize_skills(extracted)

    def _first_match(self, pattern: re.Pattern[str], text: str) -> str:
        match = pattern.search(text)
        return match.group(0).strip() if match else ""
