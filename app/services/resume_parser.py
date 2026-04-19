from __future__ import annotations

import re
from collections import OrderedDict

EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)?\d{3}[\s.-]*\d{4}\b")
URL_RE = re.compile(r"https?://[^\s)\]]+|www\.[^\s)\]]+|(?:linkedin|github|portfolio|behance)\.com/[^\s)\]]+", re.I)

SECTION_ALIASES = {
    "education": {"education", "academic background", "academics", "education and training"},
    "experience": {"experience", "work experience", "professional experience", "employment history", "work history"},
    "skills": {"skills", "technical skills", "core skills", "competencies", "languages"},
    "projects": {"projects", "selected projects", "notable projects", "personal projects"},
    "summary": {"summary", "professional summary", "profile", "objective", "about me"},
}


def parse_resume_text(text: str) -> dict:
    normalized_text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    raw_lines = [line.rstrip() for line in normalized_text.split("\n")]

    sections = _split_sections(raw_lines)
    preamble = sections.pop("preamble", [])

    combined_text = "\n".join(line for line in raw_lines if line.strip())
    summary_lines = sections.get("summary", [])

    summary = _collapse_text(summary_lines or preamble)
    parsed = {
        "personal": {
            "name": _extract_name(preamble or raw_lines),
            "email": _first_match(EMAIL_RE, combined_text),
            "phone": _format_phone(_first_match(PHONE_RE, combined_text)),
            "links": _extract_links(combined_text),
        },
        "education": _parse_education(sections.get("education", [])),
        "experience": _parse_experience(sections.get("experience", [])),
        "skills": _parse_skills(sections.get("skills", [])),
        "projects": _parse_projects(sections.get("projects", [])),
    }

    if summary:
        parsed["summary"] = summary
        parsed["personal"]["summary"] = summary

    return parsed


def _split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {"preamble": []}
    current_section = "preamble"

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            if sections.get(current_section) and sections[current_section][-1:] != [""]:
                sections[current_section].append("")
            continue

        detected_section = _detect_section_heading(line)
        if detected_section:
            current_section = detected_section
            sections.setdefault(current_section, [])
            continue

        sections.setdefault(current_section, []).append(line)

    return sections


def _detect_section_heading(line: str) -> str | None:
    normalized = re.sub(r"[:\-–—]+$", "", line.strip().lower())
    normalized = re.sub(r"\s+", " ", normalized)

    for section, aliases in SECTION_ALIASES.items():
        if normalized in aliases:
            return section

    if line.strip().isupper() and len(normalized.split()) <= 4:
        for section, aliases in SECTION_ALIASES.items():
            if normalized in aliases:
                return section

    return None


def _extract_name(lines: list[str]) -> str:
    for line in lines:
        candidate = _clean_name_candidate(line)
        if candidate:
            return candidate
    return ""


def _clean_name_candidate(line: str) -> str:
    candidate = re.sub(r"\b(resume|cv|curriculum vitae)\b", "", line, flags=re.I).strip()
    if not candidate:
        return ""
    if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate) or URL_RE.search(candidate):
        return ""
    if len(candidate) > 80 or len(candidate.split()) > 6:
        return ""
    return candidate


def _first_match(pattern: re.Pattern[str], text: str) -> str:
    match = pattern.search(text)
    return match.group(0).strip() if match else ""


def _format_phone(phone: str) -> str:
    if not phone:
        return ""

    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    return phone.strip()


def _extract_links(text: str) -> list[str]:
    seen: OrderedDict[str, None] = OrderedDict()
    for match in URL_RE.findall(text):
        link = match.strip().rstrip(".,;")
        if link and link not in seen:
            seen[link] = None
    return list(seen.keys())


def _collapse_text(lines: list[str]) -> str:
    parts = [line.strip() for line in lines if line.strip()]
    return " ".join(parts).strip()


def _lines_to_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for line in lines:
        if not line.strip():
            if current:
                blocks.append(current)
                current = []
            continue
        current.append(line.strip())

    if current:
        blocks.append(current)

    return blocks


def _parse_skills(lines: list[str]) -> list[str]:
    tokens: OrderedDict[str, None] = OrderedDict()
    for block in _lines_to_blocks(lines):
        for line in block:
            for token in re.split(r"[,;/•\n]+", line):
                cleaned = token.strip("-•* \t")
                if cleaned and cleaned.lower() not in {"skills", "technical skills", "core skills"}:
                    tokens.setdefault(cleaned, None)
    return list(tokens.keys())


def _parse_education(lines: list[str]) -> list[dict]:
    items: list[dict] = []
    for block in _lines_to_blocks(lines):
        if not block:
            continue

        institution, degree = _split_title_company(block[0])
        if not institution:
            institution = block[0]

        year_match = re.search(r"\b(19|20)\d{2}\b", " ".join(block))
        year = year_match.group(0) if year_match else ""
        degree_text = degree or (block[1] if len(block) > 1 else "")
        description = _combine_block(block[2:] if degree else block[1:])

        items.append(
            {
                "institution": institution,
                "degree": degree_text,
                "year": year,
                "description": description,
            }
        )

    return items


def _parse_experience(lines: list[str]) -> list[dict]:
    items: list[dict] = []
    for block in _lines_to_blocks(lines):
        if not block:
            continue

        title, company = _split_title_company(block[0])
        description_lines = block[1:]
        if not title:
            title = block[0]
        if not company and len(block) > 1 and not _looks_like_bullet(block[1]):
            company = block[1]
            description_lines = block[2:]

        items.append(
            {
                "title": title,
                "company": company,
                "description": _combine_block(description_lines),
            }
        )

    return items


def _parse_projects(lines: list[str]) -> list[dict]:
    items: list[dict] = []
    for block in _lines_to_blocks(lines):
        if not block:
            continue

        title, company = _split_title_company(block[0])
        description_lines = block[1:]
        if not title:
            title = block[0]

        items.append(
            {
                "title": title,
                "company": company,
                "description": _combine_block(description_lines),
                "link": _first_match(URL_RE, "\n".join(block)),
            }
        )

    return items


def _split_title_company(line: str) -> tuple[str, str]:
    cleaned = line.strip().strip("-•*")
    if not cleaned:
        return "", ""

    for separator in (" at ", " | ", " - ", " — ", " – "):
        if separator in cleaned:
            left, right = cleaned.split(separator, 1)
            return left.strip(), right.strip()

    return cleaned, ""


def _looks_like_bullet(line: str) -> bool:
    return line.strip().startswith(("-", "*", "•"))


def _combine_block(lines: list[str]) -> str:
    cleaned_lines = []
    for line in lines:
        stripped = line.strip().lstrip("-•*").strip()
        if stripped:
            cleaned_lines.append(stripped)
    return " ".join(cleaned_lines).strip()