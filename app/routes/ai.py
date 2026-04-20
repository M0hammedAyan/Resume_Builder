from __future__ import annotations

import copy
import json
import logging
import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud.storage import create_resume_version, get_resume, update_resume
from app.models.user import User
from app.schemas.ai import (
    AIChatUpdateAction,
    AIChatUpdateIn,
    AIChatUpdateOut,
    AIRewriteIn,
    AIRewriteOut,
)
from app.services.ai_router import route_ai_task

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)

_ALLOWED_SECTIONS = {"projects", "experience", "skills", "education"}
_ALLOWED_INTENTS = {"add_project", "add_experience", "update_section", "delete_item", "general_query"}


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


def validate_data(intent: str, extracted: dict) -> AIChatUpdateAction:
    if intent == "add_project":
        cleaned = _clean_empty_values(extracted)
        if not cleaned.get("title") or not cleaned.get("description"):
            raise ValueError("Project title and description are required")
        return AIChatUpdateAction.model_validate({
            "action": "add",
            "section": "projects",
            "data": cleaned,
        })

    if intent == "add_experience":
        cleaned = _clean_empty_values(extracted)
        if not cleaned.get("title"):
            raise ValueError("Experience title is required")
        if not (cleaned.get("company") or cleaned.get("description")):
            raise ValueError("Experience company or description is required")
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

    try:
        intent = classify_intent(payload.message)
        if intent == "general_query":
            logger.info("chat-update general_query", extra={"user_id": str(user.id), "resume_id": payload.resume_id})
            return AIChatUpdateOut(
                status="error",
                message="Could not understand input",
                action="none",
                updated_resume=dict(resume.resume_json or {}),
                applied_action=None,
            )

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
            message="Could not understand input",
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