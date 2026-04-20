"""
AI-FIRST Resume Parser

ARCHITECTURE:
Raw Text → AI Extraction (JSON) → Validation → Fallback Fix → Regex Fallback → Deduplication → Final JSON

This approach lets AI handle the complexity instead of relying on brittle rules.
"""

import json
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# Regex patterns for fallback extraction
EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_PATTERN = r"\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
CGPA_PATTERN = r"\b\d\.\d{1,2}\b"
BULLET_PATTERN = r"[•\-\*]"


def normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    return text.lower().strip()


def clean_text(text: str) -> str:
    """Normalize whitespace while preserving useful line boundaries."""
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\t", " ")
    lines = []
    for line in text.split("\n"):
        line = re.sub(r"\s{2,}", " ", line).strip()
        lines.append(line)
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _is_table_like(line: str) -> bool:
    return bool(line.strip()) and (("  " in line and len(line.split()) > 3) or ("|" in line and len(line.split("|")) > 2))


def _normalize_table_like_text(text: str) -> str:
    normalized_lines = []
    for raw_line in text.split("\n"):
        line = raw_line.rstrip()
        if not _is_table_like(line):
            normalized_lines.append(line)
            continue

        cols = [segment.strip() for segment in re.split(r"\s{2,}|\s*\|\s*", line) if segment.strip()]
        if len(cols) < 2:
            normalized_lines.append(line)
            continue

        normalized_lines.append("; ".join(cols))

    return "\n".join(normalized_lines)


def preprocess_for_ai(text: str) -> str:
    """Pre-clean text and normalize table-like rows before AI parsing."""
    return clean_text(_normalize_table_like_text(text))


def safe_parse_json(text: str) -> dict:
    """Safely parse JSON from text, handling markdown code blocks."""
    logger.debug("Parsing JSON response from AI")
    
    # Remove markdown code blocks if present
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}. Text: {text[:200]}")
        return {}


def extract_email(text: str) -> str:
    """Extract email using regex fallback."""
    match = re.search(EMAIL_PATTERN, text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Extract phone using regex fallback."""
    for candidate in re.findall(PHONE_PATTERN, text):
        digits = re.sub(r"\D", "", candidate)
        if len(digits) >= 10:
            return candidate
    return ""


def extract_cgpa(text: str) -> str:
    """Extract CGPA using regex fallback."""
    match = re.search(CGPA_PATTERN, text)
    return match.group(0) if match else ""


def extract_links(text: str) -> list:
    """Extract GitHub/LinkedIn links using regex."""
    pattern = r"https?://[^\s)]+|github\.com/[^\s)]+|linkedin\.com/[^\s)]+"
    return re.findall(pattern, text, re.IGNORECASE)


def extract_name(text: str) -> str:
    """Extract name from first line or email prefix."""
    skip_tokens = {
        "education",
        "experience",
        "projects",
        "skills",
        "summary",
        "professional summary",
    }
    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        lowered = line.lower()
        if lowered in skip_tokens:
            continue
        if ":" in line or ";" in line or "|" in line or "," in line:
            continue
        if re.search(r"\d", line):
            continue
        if 3 <= len(line) <= 50 and (line.isalpha() or " " in line):
            return line
    
    # Fallback: extract from email
    email = extract_email(text)
    if email:
        return email.split("@")[0].replace(".", " ").title()
    
    return ""


def parse_with_ai(text: str, correction_notes: str = "", previous_data: Optional[dict] = None) -> dict:
    """
    STEP 1: AI-FIRST EXTRACTION
    Send full resume text to Gemini with strict JSON format.
    """
    logger.debug("STEP 1: AI-First Extraction")
    
    from app.services.ai_router import route_ai_task
    
    correction_block = ""
    if correction_notes:
        correction_block += f"\nCorrection notes:\n{correction_notes}\n"
    if previous_data:
        correction_block += f"\nPrevious extraction JSON:\n{json.dumps(previous_data, ensure_ascii=True)}\n"

    prompt = f"""You are parsing resume text that may contain hidden tables or multi-column layouts.

CRITICAL: Return ONLY valid JSON, no other text, no markdown code blocks, no explanations.

CRITICAL RULES:
- Input text may come from tables that lost formatting
- Multiple columns may be merged into one line
- Do NOT treat each line as a separate entity blindly
- Reconstruct logical grouping
- Do NOT merge multiple projects into one entry
- Do NOT split one project into many fragments
- Include CGPA only if present in education
- Do NOT hallucinate data
- Leave fields empty ("" or []) if unsure

Return format:
{{
  "personal": {{
    "name": "",
    "email": "",
    "phone": ""
  }},
  "education": [
    {{
      "degree": "",
      "institution": "",
      "cgpa": "",
      "year": ""
    }}
  ],
  "experience": [
    {{
      "title": "",
      "company": "",
      "description": ""
    }}
  ],
  "projects": [
    {{
      "title": "",
      "description": "",
      "skills": []
    }}
  ],
  "skills": []
}}

INSTRUCTIONS:
1. Detect grouped information for education, projects, experience, and skills.
2. If text looks tabular, combine related values into logical entries.
3. Prioritize logical grouping over line breaks.
4. Return exactly the JSON structure above.
{correction_block}

Resume text:
{text}"""
    
    try:
        response = route_ai_task("resume_parsing", prompt)
        logger.debug(f"AI Response received: {len(response)} chars")
        data = safe_parse_json(response)
        logger.debug(f"Successfully parsed AI response")
        return data
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        return {}


def _count_project_hints(text: str) -> int:
    lowered = text.lower()
    project_mentions = lowered.count("project")
    bullet_mentions = len(re.findall(BULLET_PATTERN, text))
    # Approximate project item hints from bullets in project-heavy resumes.
    return max(project_mentions, bullet_mentions // 2)


def _merge_fragmented_projects(projects: list[dict]) -> list[dict]:
    merged: list[dict] = []
    for project in projects:
        if not isinstance(project, dict):
            continue

        title = str(project.get("title", "")).strip()
        description = str(project.get("description", "")).strip()

        if not merged:
            merged.append(project)
            continue

        # Merge likely fragments into previous project entry.
        if (not title and description) or (title and len(title.split()) <= 2 and not description):
            prev = merged[-1]
            prev_desc = str(prev.get("description", "")).strip()
            extra = description or title
            prev["description"] = (prev_desc + " " + extra).strip() if prev_desc else extra
            continue

        merged.append(project)

    return merged


def correction_pass(data: dict, text: str) -> dict:
    """Second pass for correcting merge/split issues from rough extraction."""
    issues: list[str] = []
    projects = data.get("projects") if isinstance(data.get("projects"), list) else []

    hint_count = _count_project_hints(text)
    if len(projects) <= 1 and hint_count >= 2:
        issues.append("Projects likely merged. Split into distinct project entries.")

    if len(projects) >= 4 and sum(1 for p in projects if isinstance(p, dict) and len(str(p.get("title", "")).split()) <= 2) >= 2:
        issues.append("Projects may be over-split. Merge fragments into logical entries.")

    if not issues:
        data["projects"] = _merge_fragmented_projects(projects)
        return data

    corrected = parse_with_ai(text, correction_notes=" ".join(issues), previous_data=data)
    if not isinstance(corrected, dict) or not corrected:
        data["projects"] = _merge_fragmented_projects(projects)
        return data

    corrected = validate_structure(corrected)
    corrected["projects"] = _merge_fragmented_projects(corrected.get("projects", []))
    return corrected


def validate_structure(data: dict) -> dict:
    """
    STEP 2: STRICT VALIDATION
    Ensure proper JSON structure and data types.
    """
    logger.debug("STEP 2: Validation Layer")
    
    # Ensure all required fields exist
    if not isinstance(data.get("personal"), dict):
        data["personal"] = {"name": "", "email": "", "phone": ""}
    
    if not isinstance(data.get("education"), list):
        data["education"] = []
    
    if not isinstance(data.get("experience"), list):
        data["experience"] = []
    
    if not isinstance(data.get("projects"), list):
        data["projects"] = []
    
    if not isinstance(data.get("skills"), list):
        data["skills"] = []
    
    # Validate each education entry
    for edu in data["education"]:
        if not isinstance(edu, dict):
            continue
        edu.setdefault("degree", "")
        edu.setdefault("institution", "")
        edu.setdefault("cgpa", "")
        edu.setdefault("year", "")
    
    # Validate each experience entry
    for exp in data["experience"]:
        if not isinstance(exp, dict):
            continue
        exp.setdefault("title", "")
        exp.setdefault("company", "")
        exp.setdefault("description", "")
    
    # Validate each project entry
    for proj in data["projects"]:
        if not isinstance(proj, dict):
            continue
        proj.setdefault("title", "")
        proj.setdefault("description", "")
        if not isinstance(proj.get("skills"), list):
            proj["skills"] = []
    
    logger.debug(f"Validation passed. Structure: education={len(data['education'])}, experience={len(data['experience'])}, projects={len(data['projects'])}")
    return data


def fix_projects(data: dict, text: str) -> dict:
    """
    STEP 3: PROJECT FIX
    If only 1 project extracted but text likely has multiple, split and re-extract.
    """
    logger.debug("STEP 3: Project Fix Check")
    
    projects = data.get("projects", [])
    
    # Controlled fallback split when projects are merged.
    if len(projects) <= 1 and _count_project_hints(text) >= 2:
        logger.debug("Detected likely merged projects; running controlled correction pass")
        corrected = correction_pass(data, text)
        if isinstance(corrected, dict):
            return corrected

    data["projects"] = _merge_fragmented_projects(projects)
    
    return data


def fix_cgpa_and_regex(data: dict, text: str) -> dict:
    """
    STEP 4: FALLBACK REGEX
    Extract email, phone, CGPA if missing or incomplete.
    """
    logger.debug("STEP 4: Regex Fallback Extraction")
    
    # Fix personal info
    personal = data.get("personal", {})
    if not personal.get("email"):
        personal["email"] = extract_email(text)
    if not personal.get("phone"):
        personal["phone"] = extract_phone(text)
    if not personal.get("name"):
        personal["name"] = extract_name(text)
    
    data["personal"] = personal
    
    # Fix CGPA in education
    for edu in data.get("education", []):
        if not edu.get("cgpa"):
            cgpa = extract_cgpa(text)
            if cgpa:
                edu["cgpa"] = cgpa
    
    logger.debug(f"Regex extraction: email={bool(personal.get('email'))}, phone={bool(personal.get('phone'))}, cgpa={sum(1 for e in data.get('education', []) if e.get('cgpa'))}")
    return data


def deduplicate_items(data: dict) -> dict:
    """Remove duplicate projects, experience, education entries."""
    logger.debug("STEP 5: Deduplication")
    
    # Deduplicate projects
    seen_projects = set()
    unique_projects = []
    for proj in data.get("projects", []):
        key = normalize_text(proj.get("title", ""))
        if key and key not in seen_projects:
            seen_projects.add(key)
            unique_projects.append(proj)
    data["projects"] = unique_projects
    
    # Deduplicate experience
    seen_exp = set()
    unique_exp = []
    for exp in data.get("experience", []):
        key = (normalize_text(exp.get("title", "")), normalize_text(exp.get("company", "")))
        if key[0] and key not in seen_exp:
            seen_exp.add(key)
            unique_exp.append(exp)
    data["experience"] = unique_exp
    
    # Deduplicate education
    seen_edu = set()
    unique_edu = []
    for edu in data.get("education", []):
        key = (normalize_text(edu.get("degree", "")), normalize_text(edu.get("institution", "")))
        if key[0] and key not in seen_edu:
            seen_edu.add(key)
            unique_edu.append(edu)
    data["education"] = unique_edu
    
    # Deduplicate skills
    seen_skills = set()
    unique_skills = []
    for skill in data.get("skills", []):
        normalized = normalize_text(skill)
        if normalized and normalized not in seen_skills:
            seen_skills.add(normalized)
            unique_skills.append(skill)
    data["skills"] = unique_skills
    
    logger.debug(f"Deduplicated: {len(data['projects'])} projects, {len(data['experience'])} exp, {len(data['education'])} edu, {len(data['skills'])} skills")
    return data


def fallback_resume(text: str) -> dict:
    """Return a minimal, always-valid resume payload."""
    return {
        "personal": {},
        "education": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "raw_text": text,
    }


def _has_meaningful_content(data: dict) -> bool:
    personal = data.get("personal") if isinstance(data.get("personal"), dict) else {}
    if any(str(personal.get(field, "")).strip() for field in ("name", "email", "phone")):
        return True

    for section_name in ("education", "experience", "projects"):
        section = data.get(section_name)
        if isinstance(section, list):
            for item in section:
                if isinstance(item, dict):
                    if any(str(value).strip() for value in item.values() if isinstance(value, str)):
                        return True
                    if any(value for value in item.values() if isinstance(value, list)):
                        return True
                elif str(item).strip():
                    return True

    skills = data.get("skills")
    if isinstance(skills, list) and any(str(skill).strip() for skill in skills):
        return True

    return False


def handle_upload(text: str) -> tuple[dict, bool]:
    """Parse resume safely for uploads without ever failing the caller."""
    try:
        parsed = parse_resume_structured(text, use_ai=True)
    except Exception:
        logger.exception("Structured parsing failed; using fallback payload")
        parsed = fallback_resume(text)

    is_parsed = _has_meaningful_content(parsed)

    if not isinstance(parsed, dict):
        parsed = fallback_resume(text)
        is_parsed = False

    parsed["raw_text"] = text
    parsed["is_parsed"] = is_parsed
    return parsed, is_parsed


def basic_fallback_extraction(text: str) -> dict:
    """
    Basic fallback extraction when AI unavailable.
    Uses simple heuristics without brittle section matching.
    """
    logger.debug("Using basic fallback extraction (no AI)")
    
    data = {
        "personal": {"name": "", "email": "", "phone": ""},
        "education": [],
        "experience": [],
        "projects": [],
        "skills": []
    }
    
    # Extract personal info
    data["personal"]["name"] = extract_name(text)
    data["personal"]["email"] = extract_email(text)
    data["personal"]["phone"] = extract_phone(text)
    
    # Extract skills (comma-separated anywhere in text)
    for line in text.split("\n"):
        if "," in line and len(line.split(",")) > 3:
            skills = [s.strip() for s in line.split(",") if s.strip()]
            if skills:
                data["skills"] = skills
                break
    
    # Extract CGPA from education section
    cgpa = extract_cgpa(text)
    if cgpa:
        data["education"].append({
            "degree": "",
            "institution": "",
            "cgpa": cgpa,
            "year": ""
        })
    
    return data


def parse_resume_structured(text: str, use_ai: bool = True) -> dict:
    """
    AI-FIRST RESUME PARSING
    
    Architecture:
    1. AI Extraction - send full resume to Gemini with strict JSON format
    2. Validation - ensure correct structure and data types
    3. Project Fix - if projects look incomplete, split and re-extract
    4. Fallback Regex - extract email, phone, CGPA as fallback
    5. Deduplication - remove duplicate entries
    
    Args:
        text: Raw resume text
        use_ai: Whether to use AI extraction (default True)
        
    Returns:
        Structured resume JSON
    """
    logger.debug("=" * 60)
    logger.debug("STARTING AI-FIRST RESUME PARSING")
    logger.debug(f"AI enabled: {use_ai}, Text length: {len(text)} chars")
    
    preprocessed_text = preprocess_for_ai(text)

    # STEP 1: AI Extraction or Basic Fallback
    if use_ai:
        data = parse_with_ai(preprocessed_text)
    else:
        data = basic_fallback_extraction(preprocessed_text)
    
    # STEP 2: Validation
    data = validate_structure(data)
    
    # STEP 3: Correction pass + project fix
    if use_ai:
        data = correction_pass(data, preprocessed_text)
        data = fix_projects(data, preprocessed_text)
    
    # STEP 4: Regex Fallback
    data = fix_cgpa_and_regex(data, preprocessed_text)
    
    # STEP 5: Deduplication
    data = deduplicate_items(data)
    
    logger.debug(f"FINAL RESULT:")
    logger.debug(f"  Personal: {data['personal']['name']}")
    logger.debug(f"  Experience: {len(data['experience'])} entries")
    logger.debug(f"  Education: {len(data['education'])} entries")
    logger.debug(f"  Projects: {len(data['projects'])} entries")
    logger.debug(f"  Skills: {len(data['skills'])} items")
    logger.debug("=" * 60)
    
    return data
