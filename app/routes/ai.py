from __future__ import annotations

import copy
import json
import logging
import re
from typing import cast
from typing import Mapping
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud.storage import create_resume_version, get_resume, update_resume
from app.models.user import User
from app.schemas.ai import (
    AIChatAssistIn,
    AIChatAssistOut,
    AIChatUpdateAction,
    AIChatUpdateIn,
    AIChatUpdateOut,
    AIParseUpdateIn,
    AIParseUpdateOut,
    AIRewriteIn,
    AIRewriteOut,
    StructuredIntent,
)
from app.services.ai_router import route_ai_task

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)

_ALLOWED_SECTIONS = {"projects", "experience", "skills", "education"}
_ALLOWED_INTENTS = {"add_project", "add_experience", "update_section", "delete_item", "general_query"}
_STRUCTURED_INTENTS = {"add_project", "add_experience", "add_education", "add_skill", "update_summary", "unknown"}
REQUIRED_FIELDS = {
    "add_project": ["title", "description", "skills"],
    "add_experience": ["title", "company", "duration"],
}

_PROJECT_SKILL_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "node", "nodejs", "fastapi", "flask", "django",
    "opencv", "pytorch", "tensorflow", "numpy", "pandas", "sql", "postgresql", "mysql", "mongodb", "redis",
    "aws", "azure", "gcp", "docker", "kubernetes", "html", "css", "latex", "machine learning", "deep learning",
    "nlp", "computer vision", "scikit-learn", "git",
}


def _as_dict(value: object) -> dict | None:
    return value if isinstance(value, dict) else None


def _empty_structured_data() -> dict[str, object]:
    return {
        "title": "",
        "description": "",
        "company": "",
        "institution": "",
        "degree": "",
        "skills": [],
    }


def validate_fields(intent: str, data: Mapping[str, object]) -> list[str]:
    missing: list[str] = []
    required = REQUIRED_FIELDS.get(intent, [])
    for field in required:
        value = data.get(field)
        if isinstance(value, list):
            if not any(str(item).strip() for item in value):
                missing.append(field)
            continue
        if not str(value or "").strip():
            missing.append(field)
    return missing


def _normalize_structured_data(payload: dict | None) -> dict[str, object]:
    normalized = _empty_structured_data()
    if not isinstance(payload, dict):
        return normalized

    for key in ("title", "description", "company", "institution", "degree"):
        value = payload.get(key)
        if value is None:
            continue
        normalized[key] = str(value).strip()

    skills = payload.get("skills")
    if isinstance(skills, list):
        normalized["skills"] = [str(item).strip() for item in skills if str(item).strip()]
    elif isinstance(skills, str) and skills.strip():
        normalized["skills"] = [token.strip() for token in re.split(r",|/|\|| and ", skills) if token.strip()]

    return normalized


def _extract_skills_from_text(message: str) -> list[str]:
    match = re.search(r"(?:using|skills?\s*:?|with)\s+(.+)$", message, flags=re.IGNORECASE)
    candidate = match.group(1).strip() if match else ""
    if not candidate:
        candidate = message.strip()
    parts = [token.strip() for token in re.split(r",|/|\|| and ", candidate) if token.strip()]
    cleaned: list[str] = []
    for token in parts:
        t = re.sub(r"^(add|include|skill|skills|on|in)\s+", "", token, flags=re.IGNORECASE).strip(" .")
        if t:
            cleaned.append(t)
    return cleaned


def _extract_institution(message: str) -> str:
    match = re.search(r"\bfrom\s+([a-z0-9 .&\-]+)$", message, flags=re.IGNORECASE)
    if not match:
        return ""
    return match.group(1).strip(" .,")


def _extract_company(message: str) -> str:
    match = re.search(r"\bat\s+([a-z0-9 .&\-]+?)(?:\s+as\s+|\s+for\s+|\s+in\s+|$)", message, flags=re.IGNORECASE)
    if not match:
        return ""
    return match.group(1).strip(" .,")


def _extract_role(message: str) -> str:
    match = re.search(r"\bas\s+([a-z0-9 .&\-]+?)(?:\s+at\s+|\s+for\s+|\s+in\s+|$)", message, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip(" .,")
    if re.search(r"\bintern(ship)?\b", message, flags=re.IGNORECASE):
        return "Intern"
    return ""


def _heuristic_structured_parse(message: str) -> dict[str, object]:
    text = message.strip()
    lower = text.lower()

    if len(text) < 4:
        return {"intent": "unknown", "data": {}}

    data = _empty_structured_data()

    if re.search(r"\b(summary|profile|about me|objective)\b", lower) and re.search(r"\b(update|rewrite|change|improve|set|make)\b", lower):
        summary_text = re.sub(r"^.*?(?:summary|profile|about me|objective)\s*:?\s*", "", text, flags=re.IGNORECASE)
        summary_text = summary_text if summary_text else text
        data["description"] = summary_text.strip()
        return {"intent": "update_summary", "data": data}

    if re.search(r"\b(skill|skills)\b", lower) and re.search(r"\b(add|include|know|proficient|expert|familiar)\b", lower):
        data["skills"] = _extract_skills_from_text(text)
        return {"intent": "add_skill", "data": data}

    if re.search(r"\b(btech|b\.tech|be|b\.e|bachelor|bachelors|master|masters|mtech|m\.tech|phd|degree|university|college|school|graduated|completed)\b", lower):
        degree_match = re.search(r"\b(btech|b\.tech|be|b\.e|bachelor(?:s)?(?:\s+of\s+[a-z ]+)?|master(?:s)?(?:\s+of\s+[a-z ]+)?|mtech|m\.tech|phd)\b", lower)
        if degree_match:
            data["degree"] = degree_match.group(1).upper().replace(".", "")
            data["title"] = data["degree"]
        data["institution"] = _extract_institution(text)
        data["description"] = text
        return {"intent": "add_education", "data": data}

    if re.search(r"\b(project|built|created|developed|implemented|designed|engineered)\b", lower):
        topic_match = re.search(r"(?:project\s+on|using)\s+([a-z0-9 .&\-]+)", text, flags=re.IGNORECASE)
        if topic_match:
            topic = topic_match.group(1).strip(" .,")
            data["title"] = topic.title()
        else:
            data["title"] = "Project"
        data["description"] = text
        data["skills"] = _extract_skills_from_text(text)
        return {"intent": "add_project", "data": data}

    if re.search(r"\b(worked|experience|intern|role|job|position|joined|led|managed)\b", lower):
        data["title"] = _extract_role(text) or "Experience"
        data["company"] = _extract_company(text)
        data["description"] = text
        return {"intent": "add_experience", "data": data}

    return {"intent": "unknown", "data": {}}


def parse_resume_update(message: str) -> dict[str, object]:
    heuristic = _heuristic_structured_parse(message)
    heuristic_intent = str(heuristic.get("intent", "unknown")).strip().lower()
    if heuristic_intent != "unknown":
        heuristic["data"] = _normalize_structured_data(_as_dict(heuristic.get("data")))
        return heuristic

    prompt = f"""
Convert the input into strict JSON for resume updates.

Allowed intents:
- add_project
- add_experience
- add_education
- add_skill
- update_summary
- unknown

Input:
{message}

Return ONLY valid JSON in this format:
{{
  "intent": "add_project | add_experience | add_education | add_skill | update_summary | unknown",
  "data": {{
    "title": "",
    "description": "",
    "company": "",
    "institution": "",
    "degree": "",
    "skills": []
  }}
}}

Rules:
- Do not hallucinate
- Keep missing fields empty
- If unclear, use intent "unknown" and data {{}}
"""

    try:
        raw = route_ai_task(task_type="classification", prompt=prompt)
        parsed = safe_parse_json(_strip_json_wrapper(raw)) if raw else None
    except Exception:  # noqa: BLE001
        parsed = None

    if not parsed:
        return {"intent": "unknown", "data": {}}

    intent = str(parsed.get("intent", "unknown")).strip().lower()
    if intent not in _STRUCTURED_INTENTS:
        return {"intent": "unknown", "data": {}}

    if intent == "unknown":
        return {"intent": "unknown", "data": {}}

    data = _normalize_structured_data(_as_dict(parsed.get("data")))
    return {"intent": intent, "data": data}


def _is_structured_project_input(text: str) -> bool:
    return bool(re.search(r"\b(title\s*:|description\s*:|tech\s*:|stack\s*:)", text, flags=re.IGNORECASE))


def _parse_structured_project_input(text: str) -> dict[str, object]:
    title_match = re.search(r"title\s*:\s*['\"]?(.*?)['\"]?(?=\s*(?:,|description\s*:|tech\s*:|stack\s*:|$))", text, flags=re.IGNORECASE)
    desc_match = re.search(r"description\s*:\s*['\"]?(.*?)['\"]?(?=\s*(?:,|title\s*:|tech\s*:|stack\s*:|$))", text, flags=re.IGNORECASE)
    tech_match = re.search(r"(?:tech|stack)\s*:\s*['\"]?(.*?)['\"]?(?=\s*(?:,|title\s*:|description\s*:|$))", text, flags=re.IGNORECASE)

    title = title_match.group(1).strip() if title_match else ""
    description = desc_match.group(1).strip() if desc_match else ""
    skills_raw = tech_match.group(1).strip() if tech_match else ""
    skills = [token.strip().lower() for token in re.split(r",|/|\|| and ", skills_raw) if token.strip()]

    return {
        "title": title,
        "description": description,
        "skills": skills,
    }


def _extract_skills_from_description(description: str) -> list[str]:
    lower = description.lower()
    found: list[str] = []
    for keyword in _PROJECT_SKILL_KEYWORDS:
        pattern = rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])"
        if re.search(pattern, lower):
            found.append(keyword)
    return sorted(set(found))


def _rewrite_with_ai(text: str) -> str:
    clean = str(text or "").strip()
    if not clean:
        return ""

    prompt = f"Rewrite professionally for ATS resume use with action verbs and concise style. Return only one sentence. Text: {clean}"
    try:
        rewritten = route_ai_task(task_type="rewrite", prompt=prompt)
    except Exception:  # noqa: BLE001
        rewritten = ""
    rewritten_text = str(rewritten or "").strip()
    if rewritten_text:
        return rewritten_text

    # Deterministic fallback rewrite when AI is unavailable.
    sentence = clean[0].upper() + clean[1:] if len(clean) > 1 else clean.upper()
    sentence = re.sub(r"^I\s+(built|developed|created|implemented|made)\b", lambda m: m.group(1).capitalize(), sentence, flags=re.IGNORECASE)
    sentence = re.sub(r"^I\s+", "", sentence, flags=re.IGNORECASE)
    sentence = sentence.strip()
    if not sentence.endswith("."):
        sentence += "."
    return sentence


def _rewrite_project_description(description: str) -> str:
    clean = description.strip()
    if not clean:
        return ""

    prompt = f"""
Rewrite this project description for a resume.

Rules:
- Use strong action verbs
- ATS-friendly
- Keep concise
- Preserve factual meaning
- Do not invent details

Return ONLY one improved sentence.

Text:
{clean}
"""

    try:
        rewritten = route_ai_task(task_type="rewrite", prompt=prompt)
        return rewritten.strip() if rewritten and rewritten.strip() else clean
    except Exception:  # noqa: BLE001
        return clean


def _find_new_skills(existing: list[str], incoming: list[str]) -> list[str]:
    existing_set = {str(skill).strip().lower() for skill in existing if str(skill).strip()}
    return [skill for skill in incoming if skill.lower() not in existing_set]


def _next_project_question(missing_fields: list[str]) -> str:
    if "title" in missing_fields:
        return "What is the project title?"
    if "skills" in missing_fields:
        return "What technologies did you use?"
    return "Can you describe what you built?"


def _next_question_for_intent(intent: str, missing_fields: list[str]) -> str:
    if not missing_fields:
        return "Please provide more detail."
    return f"Please provide: {missing_fields[0]}"


def _build_project_assist_response(parsed_data: dict[str, object], existing_skills: list[str]) -> AIChatAssistOut:
    title = str(parsed_data.get("title", "")).strip()
    description = str(parsed_data.get("description", "")).strip()

    raw_base_skills = parsed_data.get("skills")
    normalized_base: list[str] = []
    if isinstance(raw_base_skills, list):
        normalized_base = [str(skill).strip().lower() for skill in raw_base_skills if str(skill).strip()]
    inferred_skills = _extract_skills_from_description(description)
    merged_skills = sorted(set(normalized_base + inferred_skills))

    normalized = {
        "title": title,
        "description": description,
        "skills": merged_skills,
    }
    missing_fields = validate_fields("add_project", normalized)

    if missing_fields:
        return AIChatAssistOut(
            intent="add_project",
            suggested_update=normalized,
            missing_fields=missing_fields,
            needs_clarification=True,
            question=_next_question_for_intent("add_project", missing_fields),
            confirmation_required=False,
        )

    rewritten_description = _rewrite_with_ai(description)
    suggested_update = {
        "title": title,
        "description": rewritten_description,
        "skills": merged_skills,
    }
    new_skills = _find_new_skills(existing_skills, merged_skills)

    return AIChatAssistOut(
        intent="add_project",
        suggested_update=suggested_update,
        missing_fields=[],
        needs_clarification=False,
        question="Do you want to add these skills to your resume?" if new_skills else None,
        new_skills=new_skills,
        confirmation_required=True,
    )


def _structured_to_chat_action(parsed: dict[str, object]) -> AIChatUpdateAction | None:
    intent = str(parsed.get("intent", "unknown")).strip().lower()
    data = _normalize_structured_data(_as_dict(parsed.get("data")))

    if intent == "add_project":
        rewritten_description = _rewrite_with_ai(str(data.get("description", "")).strip())
        payload = {
            "title": str(data.get("title", "")).strip() or "Project",
            "description": rewritten_description,
            "skills": data.get("skills", []),
        }
        if not payload["description"]:
            return None
        return AIChatUpdateAction.model_validate({"action": "add", "section": "projects", "data": payload})

    if intent == "add_experience":
        payload = {
            "title": str(data.get("title", "")).strip() or "Experience",
            "company": str(data.get("company", "")).strip(),
            "description": str(data.get("description", "")).strip(),
        }
        if not (payload["company"] or payload["description"]):
            return None
        return AIChatUpdateAction.model_validate({"action": "add", "section": "experience", "data": payload})

    if intent == "add_education":
        payload = {
            "title": str(data.get("title", "")).strip() or str(data.get("degree", "")).strip() or "Education",
            "degree": str(data.get("degree", "")).strip(),
            "institution": str(data.get("institution", "")).strip(),
            "description": str(data.get("description", "")).strip(),
        }
        if not (payload["degree"] or payload["institution"] or payload["description"]):
            return None
        return AIChatUpdateAction.model_validate({"action": "add", "section": "education", "data": payload})

    if intent == "add_skill":
        skills = data.get("skills", [])
        if not isinstance(skills, list) or not skills:
            return None
        return AIChatUpdateAction.model_validate({"action": "add", "section": "skills", "data": {"skills": skills}})

    return None


def _strip_json_wrapper(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    return cleaned.strip()


def _extract_first_json_object(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(text)):
        ch = text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start:idx + 1]

    return None


def safe_parse_json(text: str) -> dict | None:
    try:
        parsed = json.loads(text)
    except Exception:  # noqa: BLE001
        try:
            cleaned = text.strip().replace("```json", "").replace("```", "")
            parsed = json.loads(cleaned)
        except Exception:  # noqa: BLE001
            maybe_json = _extract_first_json_object(text)
            if not maybe_json:
                return None
            try:
                parsed = json.loads(maybe_json)
            except Exception:  # noqa: BLE001
                return None

    if not isinstance(parsed, dict):
        return None
    return parsed


def _generate_json(prompt: str, task_type: str = "analysis") -> dict:
    try:
        raw = route_ai_task(task_type=task_type, prompt=prompt)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("AI service unavailable") from exc

    if not raw:
        raise ValueError("AI returned empty response")

    parsed = safe_parse_json(_strip_json_wrapper(raw))
    if parsed is None:
        raise ValueError("AI output parsing failed")
    return parsed


def classify_intent(message: str) -> str:
    lower = message.lower()

    # Deterministic fast-path for explicit commands to avoid model ambiguity.
    if re.search(r"\b(add|include|insert)\b", lower):
        if "experience" in lower:
            return "add_experience"
        if "project" in lower:
            return "add_project"
    if re.search(r"\b(delete|remove)\b", lower):
        return "delete_item"
    if re.search(r"\b(update|edit|change|replace)\b", lower):
        return "update_section"

    prompt = f"""
Classify user intent into one of:
- add_project
- add_experience
- update_section
- delete_item
- general_query

Input:
{message}

Return ONLY JSON:
{{
  "intent": "..."
}}
"""
    intent = ""

    try:
        raw = route_ai_task(task_type="classification", prompt=prompt)
        parsed = safe_parse_json(_strip_json_wrapper(raw)) if raw else None
        if parsed:
            intent = str(parsed.get("intent", "")).strip().lower()
        elif raw:
            cleaned = raw.strip().splitlines()[0].strip().strip("`\"' .,:;!?").lower()
            token = re.sub(r"\s+", "_", cleaned)
            if token in _ALLOWED_INTENTS:
                intent = token
    except Exception:  # noqa: BLE001
        intent = ""

    if intent not in _ALLOWED_INTENTS:
        if any(word in lower for word in ("delete", "remove")):
            intent = "delete_item"
        elif any(word in lower for word in ("update", "edit", "change", "replace")):
            intent = "update_section"
        elif any(word in lower for word in ("experience", "worked", "role", "position", "company")):
            intent = "add_experience"
        elif any(word in lower for word in ("project", "built", "created", "developed")):
            intent = "add_project"

    if intent not in _ALLOWED_INTENTS:
        return "general_query"
    return intent


def extract_data(message: str, intent: str) -> dict:
    if intent == "add_project":
        prompt = f"""
Extract structured project data from this user input.

Input:
{message}

Return ONLY JSON:
{{
  "title": "",
  "description": "",
  "skills": []
}}

Rules:
- No hallucination
- Keep concise
- Use given input only
"""
        return _generate_json(prompt)

    if intent == "add_experience":
        prompt = f"""
Extract structured experience data from this user input.

Input:
{message}

Return ONLY JSON:
{{
  "title": "",
  "company": "",
  "duration": "",
  "description": "",
  "skills": []
}}

Rules:
- No hallucination
- Keep concise
- Use given input only
"""
        return _generate_json(prompt)

    if intent == "update_section":
        prompt = f"""
Extract structured update instructions from this user input.

Input:
{message}

Return ONLY JSON:
{{
  "section": "projects|experience|skills|education",
  "index": 0,
  "identifier": "",
  "fields": {{
    "key": "value"
  }}
}}

Rules:
- No hallucination
- Keep concise
- Use given input only
"""
        return _generate_json(prompt)

    if intent == "delete_item":
        prompt = f"""
Extract structured delete instructions from this user input.

Input:
{message}

Return ONLY JSON:
{{
  "section": "projects|experience|skills|education",
  "index": 0,
  "identifier": "",
  "title": "",
  "company": "",
  "name": "",
  "skill": ""
}}

Rules:
- No hallucination
- Keep concise
- Use given input only
"""
        return _generate_json(prompt)

    return {}


def _extract_field_from_text(message: str, field: str) -> str:
    # Supports patterns like: "field: value, ..." and "field value, ..."
    pattern = rf"{field}\s*:?\s*(.+?)(?=,\s*(?:title|company|duration|description|skills)\b|$)"
    match = re.search(pattern, message, flags=re.IGNORECASE)
    return match.group(1).strip() if match else ""


def fallback_extract_data(message: str, intent: str) -> dict:
    if intent == "add_experience":
        title = _extract_field_from_text(message, "title")
        company = _extract_field_from_text(message, "company")
        duration = _extract_field_from_text(message, "duration")
        description = _extract_field_from_text(message, "description")

        # Last-resort parsing when user provides plain sentence without labels.
        if not title and "experience" in message.lower():
            title = "Professional Experience"

        data: dict[str, object] = {}
        if title:
            data["title"] = title
        if company:
            data["company"] = company
        if duration:
            data["duration"] = duration
        if description:
            data["description"] = description
        return data

    if intent == "add_project":
        title = _extract_field_from_text(message, "title")
        description = _extract_field_from_text(message, "description")
        if not title:
            title = _extract_field_from_text(message, "project")
        data: dict[str, object] = {}
        if title:
            data["title"] = title
        if description:
            data["description"] = description
        return data

    return {}


def _clean_empty_values(payload: dict) -> dict:
    cleaned: dict[str, object] = {}
    for key, value in payload.items():
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                cleaned[key] = stripped
        elif isinstance(value, list):
            normalized = [str(item).strip() for item in value if str(item).strip()]
            if normalized:
                cleaned[key] = normalized
        elif isinstance(value, dict):
            nested = _clean_empty_values(value)
            if nested:
                cleaned[key] = nested
        elif value is not None:
            cleaned[key] = value
    return cleaned


def _looks_like_question(message: str) -> bool:
    text = message.strip().lower()
    if not text:
        return False
    if text.endswith("?"):
        return True
    return bool(re.match(r"^(what|how|why|when|where|can|could|would|should|is|are|do|does|did)\b", text))


def _fallback_action_from_general_query(message: str) -> AIChatUpdateAction | None:
    text = message.strip()
    if len(text) < 8:
        return None

    lower = text.lower()

    # Questions should not mutate resume content.
    if _looks_like_question(text):
        return None

    if any(token in lower for token in ("skill", "skills")) and any(token in lower for token in ("add", "include", "know", "proficient")):
        match = re.search(r"skills?\s*:?\s*(.+)$", text, flags=re.IGNORECASE)
        candidate = match.group(1).strip() if match else ""
        skills = [item.strip() for item in re.split(r",|/|\|| and ", candidate) if item.strip()]
        if skills:
            return AIChatUpdateAction.model_validate({
                "action": "add",
                "section": "skills",
                "data": {"skills": skills},
            })

    if any(token in lower for token in ("project", "built", "created", "developed", "launched", "implemented")):
        return AIChatUpdateAction.model_validate({
            "action": "add",
            "section": "projects",
            "data": {
                "title": "Project",
                "description": text,
            },
        })

    if any(token in lower for token in ("worked", "led", "managed", "improved", "increased", "reduced", "experience", "intern", "role")):
        return AIChatUpdateAction.model_validate({
            "action": "add",
            "section": "experience",
            "data": {
                "title": "Experience",
                "description": text,
            },
        })

    # Default safe fallback for statement-like resume updates.
    return AIChatUpdateAction.model_validate({
        "action": "add",
        "section": "experience",
        "data": {
            "title": "Experience",
            "description": text,
        },
    })


def validate_data(intent: str, extracted: dict) -> AIChatUpdateAction:
    if intent == "add_project":
        cleaned = _clean_empty_values(extracted)
        if not cleaned.get("title") and cleaned.get("description"):
            cleaned["title"] = "Project"
        if not cleaned.get("description") and cleaned.get("title"):
            cleaned["description"] = f"{cleaned['title']} details to refine"
        if not cleaned.get("title") and not cleaned.get("description"):
            raise ValueError("Project details are required")
        return AIChatUpdateAction.model_validate({
            "action": "add",
            "section": "projects",
            "data": cleaned,
        })

    if intent == "add_experience":
        cleaned = _clean_empty_values(extracted)
        if not cleaned.get("title") and (cleaned.get("company") or cleaned.get("description")):
            cleaned["title"] = "Experience"
        if cleaned.get("title") and not (cleaned.get("company") or cleaned.get("description")):
            cleaned["description"] = f"{cleaned['title']} details to refine"
        if not cleaned.get("title"):
            raise ValueError("Experience details are required")
        return AIChatUpdateAction.model_validate({
            "action": "add",
            "section": "experience",
            "data": cleaned,
        })

    if intent == "update_section":
        section = str(extracted.get("section", "")).strip().lower()
        if section not in _ALLOWED_SECTIONS:
            raise ValueError("Unsupported section")

        fields = extracted.get("fields")
        if not isinstance(fields, dict):
            raise ValueError("Update fields are required")

        cleaned_fields = _clean_empty_values(fields)
        if not cleaned_fields:
            raise ValueError("Update fields cannot be empty")

        data: dict[str, object] = dict(cleaned_fields)
        index = extracted.get("index")
        if isinstance(index, int):
            data["index"] = index

        identifier = str(extracted.get("identifier", "")).strip()
        if identifier:
            if section == "skills":
                data["skill"] = identifier
            else:
                data["title"] = identifier

        if "index" not in data and "title" not in data and "company" not in data and "name" not in data and "skill" not in data:
            raise ValueError("Update target could not be identified")

        return AIChatUpdateAction.model_validate({
            "action": "update",
            "section": section,
            "data": data,
        })

    if intent == "delete_item":
        section = str(extracted.get("section", "")).strip().lower()
        if section not in _ALLOWED_SECTIONS:
            raise ValueError("Unsupported section")

        data: dict[str, object] = {}
        index = extracted.get("index")
        if isinstance(index, int):
            data["index"] = index

        for key in ("title", "company", "name", "skill", "degree"):
            value = str(extracted.get(key, "")).strip()
            if value:
                data[key] = value

        identifier = str(extracted.get("identifier", "")).strip()
        if identifier:
            if section == "skills":
                data.setdefault("skill", identifier)
            else:
                data.setdefault("title", identifier)

        if not data:
            raise ValueError("Delete target could not be identified")

        return AIChatUpdateAction.model_validate({
            "action": "delete",
            "section": section,
            "data": data,
        })

    raise ValueError("Could not understand input")


def _find_target_index(items: list, data: dict) -> int | None:
    if isinstance(data.get("index"), int):
        idx = int(data["index"])
        if 0 <= idx < len(items):
            return idx

    match_fields = ("title", "company", "institution", "degree", "name", "skill")
    for field in match_fields:
        probe = str(data.get(field, "")).strip().lower()
        if not probe:
            continue
        for idx, item in enumerate(items):
            if isinstance(item, str) and probe == item.strip().lower():
                return idx
            if isinstance(item, dict):
                for candidate_key in (field, "title", "name", "institution", "company"):
                    candidate = str(item.get(candidate_key, "")).strip().lower()
                    if candidate and candidate == probe:
                        return idx
    return None


def apply_update(resume_json: dict, action: AIChatUpdateAction) -> tuple[dict, str]:
    updated = copy.deepcopy(resume_json or {})
    section = action.section
    data = dict(action.data or {})

    if section == "skills":
        skills = updated.get("skills", [])
        if not isinstance(skills, list):
            skills = []
        skills = [str(item).strip() for item in skills if str(item).strip()]

        incoming = data.get("skills")
        if isinstance(incoming, list):
            new_skills = [str(item).strip() for item in incoming if str(item).strip()]
        else:
            candidate = str(data.get("skill", "")).strip()
            new_skills = [candidate] if candidate else []

        if action.action == "add":
            for skill in new_skills:
                if skill and skill.lower() not in {s.lower() for s in skills}:
                    skills.append(skill)
            updated[section] = skills
            return updated, "Skill added successfully"

        if action.action == "update":
            idx = _find_target_index(skills, data)
            if idx is None or not new_skills:
                raise ValueError("Could not identify skill to update")
            skills[idx] = new_skills[0]
            updated[section] = skills
            return updated, "Skill updated successfully"

        idx = _find_target_index(skills, data)
        if idx is None:
            raise ValueError("Could not identify skill to delete")
        skills.pop(idx)
        updated[section] = skills
        return updated, "Skill deleted successfully"

    items = updated.get(section, [])
    if not isinstance(items, list):
        items = []

    if action.action == "add":
        if section in {"projects", "experience", "education"} and isinstance(data.get("description"), str):
            # System-enforced rewrite to prevent raw conversational text insertion.
            data["description"] = _rewrite_with_ai(str(data.get("description", "")))
        items.append(data)
        updated[section] = items
        singular = section[:-1].capitalize() if section.endswith("s") else section.capitalize()
        return updated, f"{singular} added successfully"

    idx = _find_target_index(items, data)
    if idx is None:
        raise ValueError(f"Could not identify target item in {section}")

    if action.action == "update":
        base = items[idx] if isinstance(items[idx], dict) else {"value": str(items[idx])}
        base.update(data)
        items[idx] = base
        updated[section] = items
        singular = section[:-1].capitalize() if section.endswith("s") else section.capitalize()
        return updated, f"{singular} updated successfully"

    items.pop(idx)
    updated[section] = items
    singular = section[:-1].capitalize() if section.endswith("s") else section.capitalize()
    return updated, f"{singular} deleted successfully"


@router.post("/rewrite", response_model=AIRewriteOut)
def rewrite_text(payload: AIRewriteIn) -> AIRewriteOut:
    clean_text = payload.text.strip()

    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(clean_text) > 500:
        raise HTTPException(status_code=400, detail="Text too long (max 500 characters)")

    prompt = f"""
You are an expert resume writer.

Rewrite the following text based on its context.

Context: {payload.context}

Rules:
- Use strong action verbs
- Make it ATS-friendly
- Keep it concise and impactful
- Preserve factual meaning
- Do NOT invent information

Formatting:
- Return ONLY one improved sentence
- No explanations
- No markdown

Text:
{clean_text}
"""

    try:
        improved = route_ai_task(task_type="rewrite", prompt=prompt)
        return AIRewriteOut(improved_text=improved)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {exc}"
        ) from exc


@router.post("/parse-update", response_model=AIParseUpdateOut)
def parse_update(payload: AIParseUpdateIn) -> AIParseUpdateOut:
    parsed = parse_resume_update(payload.message)
    intent = str(parsed.get("intent", "unknown")).strip().lower()
    if intent == "unknown":
        return AIParseUpdateOut(intent="unknown", data={})
    data = _normalize_structured_data(_as_dict(parsed.get("data")))
    return AIParseUpdateOut(intent=cast(StructuredIntent, intent), data=data)


@router.post("/chat-assist", response_model=AIChatAssistOut)
def chat_assist(
    payload: AIChatAssistIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIChatAssistOut:
    try:
        resume_uuid = UUID(payload.resume_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume_id") from exc

    resume = get_resume(db, resume_id=resume_uuid, user_id=user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    message = payload.message.strip()
    resume_json = dict(resume.resume_json or {})
    raw_resume_skills = resume_json.get("skills")
    existing_skills = [str(skill).strip().lower() for skill in raw_resume_skills if str(skill).strip()] if isinstance(raw_resume_skills, list) else []

    pending_intent = (payload.pending_intent or "").strip().lower()
    pending_data = _as_dict(payload.pending_data) or {}

    if _is_structured_project_input(message):
        parsed = _parse_structured_project_input(message)
        return _build_project_assist_response(parsed, existing_skills)

    if pending_intent == "add_project":
        parsed = parse_resume_update(message)
        candidate_data = _normalize_structured_data(_as_dict(parsed.get("data"))) if str(parsed.get("intent", "")).strip().lower() == "add_project" else _empty_structured_data()
        pending_skills_value = pending_data.get("skills")
        candidate_skills_value = candidate_data.get("skills")
        pending_skills = [str(skill).strip().lower() for skill in pending_skills_value if str(skill).strip()] if isinstance(pending_skills_value, list) else []
        candidate_skills = [str(skill).strip().lower() for skill in candidate_skills_value if str(skill).strip()] if isinstance(candidate_skills_value, list) else []
        merged = {
            "title": str(pending_data.get("title", "")).strip() or str(candidate_data.get("title", "")).strip(),
            "description": str(pending_data.get("description", "")).strip() or str(candidate_data.get("description", "")).strip() or message,
            "skills": pending_skills if pending_skills else candidate_skills,
        }
        return _build_project_assist_response(merged, existing_skills)

    if pending_intent == "add_experience":
        experience_data = {
            "title": str(pending_data.get("title", "")).strip(),
            "company": str(pending_data.get("company", "")).strip(),
            "duration": str(pending_data.get("duration", "")).strip(),
        }
        missing_fields = validate_fields("add_experience", experience_data)
        if missing_fields:
            return AIChatAssistOut(
                intent="add_experience",
                suggested_update=experience_data,
                missing_fields=missing_fields,
                needs_clarification=True,
                question=_next_question_for_intent("add_experience", missing_fields),
                confirmation_required=False,
            )

    parsed = parse_resume_update(message)
    intent = str(parsed.get("intent", "unknown")).strip().lower()
    parsed_data = _normalize_structured_data(_as_dict(parsed.get("data")))

    if intent == "add_project":
        return _build_project_assist_response(parsed_data, existing_skills)

    if intent == "unknown":
        return AIChatAssistOut(
            intent="add_project",
            needs_clarification=True,
            question="What is the project title?",
            confirmation_required=False,
        )

    return AIChatAssistOut(
        intent="add_project",
        needs_clarification=True,
        question="Please share a project update. Example: ADD Project Title:'...', Description:'...', Tech:'...'.",
        confirmation_required=False,
    )


@router.post("/chat-update", response_model=AIChatUpdateOut)
def chat_update_resume(
    payload: AIChatUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIChatUpdateOut:
    try:
        resume_uuid = UUID(payload.resume_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume_id") from exc

    resume = get_resume(db, resume_id=resume_uuid, user_id=user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    intent = "general_query"
    extracted: dict[str, object] = {}
    fallback_action: AIChatUpdateAction | None = None

    try:
        parsed_update = parse_resume_update(payload.message)
        parsed_intent = str(parsed_update.get("intent", "unknown")).strip().lower()
        if parsed_intent == "update_summary":
            parsed_data = _normalize_structured_data(_as_dict(parsed_update.get("data")))
            summary_text = str(parsed_data.get("description", "")).strip()
            if not summary_text:
                raise ValueError("Summary text is required")
            updated_resume = dict(resume.resume_json or {})
            updated_resume["summary"] = summary_text
            action_message = "Summary updated successfully"
            intent = "update_summary"
            extracted = parsed_data
            action = AIChatUpdateAction.model_validate({
                "action": "update",
                "section": "experience",
                "data": {"title": "Summary", "description": summary_text},
            })
        elif parsed_intent != "unknown":
            parsed_action = _structured_to_chat_action(parsed_update)
            if parsed_action is None:
                raise ValueError("Could not convert parsed update into action")
            action = parsed_action
            updated_resume, action_message = apply_update(dict(resume.resume_json or {}), action)
            intent = parsed_intent
            extracted = _normalize_structured_data(_as_dict(parsed_update.get("data")))
        else:
            intent = classify_intent(payload.message)
            if intent == "general_query":
                fallback_action = _fallback_action_from_general_query(payload.message)
                if fallback_action is None:
                    logger.info("chat-update general_query", extra={"user_id": str(user.id), "resume_id": payload.resume_id})
                    return AIChatUpdateOut(
                        status="error",
                        message="Please describe a resume edit, for example: Add experience title: ..., company: ..., description: ...",
                        action="none",
                        updated_resume=dict(resume.resume_json or {}),
                        applied_action=None,
                    )
                action = fallback_action
                updated_resume, action_message = apply_update(dict(resume.resume_json or {}), action)
                intent = "fallback_add"
                extracted = dict(action.data)
            else:
                extracted = extract_data(payload.message, intent)
                fallback = fallback_extract_data(payload.message, intent)

                # Preserve AI output, but fill missing/empty fields from deterministic parsing.
                if not extracted:
                    extracted = fallback
                elif fallback:
                    merged: dict[str, object] = dict(extracted)
                    for key, value in fallback.items():
                        current = merged.get(key)
                        if current is None:
                            merged[key] = value
                            continue
                        if isinstance(current, str) and not current.strip() and isinstance(value, str) and value.strip():
                            merged[key] = value
                        elif isinstance(current, list) and not current and isinstance(value, list) and value:
                            merged[key] = value
                    extracted = merged
                action = validate_data(intent, extracted)
                updated_resume, action_message = apply_update(dict(resume.resume_json or {}), action)
    except (RuntimeError, ValueError) as exc:
        logger.warning(
            "chat-update failed",
            extra={
                "user_id": str(user.id),
                "resume_id": payload.resume_id,
                "user_message": payload.message,
                "intent": intent,
                "extracted": extracted,
                "error": str(exc),
            },
        )
        return AIChatUpdateOut(
            status="error",
            message="Could not understand input. Try: Add experience title: ..., company: ..., description: ...",
            action="none",
            updated_resume=dict(resume.resume_json or {}),
            applied_action=None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {exc}") from exc

    update_resume(db, resume=resume, resume_json=updated_resume)
    create_resume_version(
        db,
        resume=resume,
        content=updated_resume,
        source_text=payload.message,
        change_summary=f"AI {intent} in {action.section}",
    )
    db.commit()

    logger.info(
        "chat-update applied",
        extra={
            "user_id": str(user.id),
            "resume_id": payload.resume_id,
            "user_message": payload.message,
            "intent": intent,
            "ai_output": extracted,
            "applied_change": {"action": action.action, "section": action.section, "data": action.data},
        },
    )

    verb_map = {"add": "added", "update": "updated", "delete": "deleted"}
    verb = verb_map.get(action.action, action.action)
    noun = action.section[:-1] if action.section.endswith("s") else action.section
    action_phrase = f"{verb} {noun}"
    return AIChatUpdateOut(
        status="success",
        action=action_phrase,
        updated_resume=updated_resume,
        message=action_message,
        applied_action=action,
    )