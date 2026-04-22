"""Gemini-powered resume assistant that returns structured JSON editor actions."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiResumeAssistantService:
    """Generate resume guidance and action plans using Gemini."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.model_name = os.getenv("GOOGLE_GEMINI_MODEL", "gemini-2.0-flash")
        self._model = None

        if self.api_key:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)

    def generate_actions(
        self,
        user_prompt: str,
        resume_data: dict[str, Any],
        job_description: str,
        uploaded_files_text: str,
    ) -> dict[str, Any]:
        """Return structured suggestions + frontend actions for resume editing."""
        if not self._model:
            raise RuntimeError(
                "Gemini is not configured. Set GOOGLE_API_KEY environment variable."
            )

        payload = {
            "user_prompt": user_prompt,
            "resume_data": resume_data,
            "job_description": job_description,
            "uploaded_files_text": uploaded_files_text,
        }

        system_prompt = (
            "You are an expert resume reviewer and recruiter assistant. "
            "You analyze resumes, job descriptions, and certificates. "
            "You must return structured JSON with clear actions. "
            "Do NOT return plain text explanations only."
        )

        output_contract = {
            "suggestions": [
                "string suggestions for resume improvement"
            ],
            "missing_sections": ["projects", "certifications"],
            "skills_to_add": ["Python", "NLP"],
            "skills_to_remove": ["OutdatedSkill"],
            "design_suggestions": [
                "Recommend section ordering",
                "Recommend font hierarchy",
                "Recommend heading and spacing improvements"
            ],
            "actions": [
                {
                    "type": "add_section",
                    "section": "projects"
                },
                {
                    "type": "update_skills",
                    "skills": ["Python", "NLP"]
                },
                {
                    "type": "rewrite_bullet",
                    "section": "experience",
                    "content": "Optimized model accuracy by 25%"
                }
            ]
        }

        prompt = (
            f"System prompt:\n{system_prompt}\n\n"
            "Constraints:\n"
            "- Return JSON only (no markdown code fences, no prose).\n"
            "- Do not attempt UI control or cursor control.\n"
            "- Return structured actions for frontend execution only.\n"
            "- Do not include executable code.\n"
            "- If information is missing, still return a best-effort JSON object matching schema.\n\n"
            "Expected JSON schema keys:\n"
            f"{json.dumps(output_contract, indent=2)}\n\n"
            "Input:\n"
            f"{json.dumps(payload, ensure_ascii=True)}"
        )

        response = self._model.generate_content(prompt)
        raw_text = getattr(response, "text", "") or ""

        parsed = self._parse_json(raw_text)
        parsed["model"] = self.model_name
        return parsed

    def _parse_json(self, text: str) -> dict[str, Any]:
        """Parse JSON response robustly, supporting fenced snippets."""
        if not text.strip():
            return self._fallback_payload()

        try:
            payload = json.loads(text)
            return self._normalize_payload(payload)
        except json.JSONDecodeError:
            pass

        fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
        if fence_match:
            try:
                payload = json.loads(fence_match.group(1))
                return self._normalize_payload(payload)
            except json.JSONDecodeError:
                logger.warning("Failed to parse fenced Gemini JSON response")

        obj_match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if obj_match:
            try:
                payload = json.loads(obj_match.group(0))
                return self._normalize_payload(payload)
            except json.JSONDecodeError:
                logger.warning("Failed to parse extracted Gemini JSON response")

        logger.warning("Gemini response was not valid JSON")
        return self._fallback_payload()

    def _normalize_payload(self, payload: Any) -> dict[str, Any]:
        """Normalize fields to keep API response shape stable."""
        if not isinstance(payload, dict):
            return self._fallback_payload()

        actions = payload.get("actions")
        if not isinstance(actions, list):
            actions = []

        def ensure_str_list(value: Any) -> list[str]:
            if not isinstance(value, list):
                return []
            return [str(item).strip() for item in value if str(item).strip()]

        normalized = {
            "suggestions": ensure_str_list(payload.get("suggestions")),
            "missing_sections": ensure_str_list(payload.get("missing_sections")),
            "skills_to_add": ensure_str_list(payload.get("skills_to_add")),
            "skills_to_remove": ensure_str_list(payload.get("skills_to_remove")),
            "design_suggestions": ensure_str_list(payload.get("design_suggestions")),
            "actions": [],
        }

        for action in actions:
            if isinstance(action, dict) and isinstance(action.get("type"), str):
                normalized["actions"].append(action)

        return normalized

    def _fallback_payload(self) -> dict[str, Any]:
        """Safe fallback object when model output is malformed."""
        return {
            "suggestions": [
                "Add measurable outcomes to experience bullets.",
                "Tailor your skills section to the target role.",
            ],
            "missing_sections": [],
            "skills_to_add": [],
            "skills_to_remove": [],
            "design_suggestions": [
                "Place Summary, Experience, and Skills near the top for readability.",
                "Use a clear heading hierarchy with consistent spacing.",
            ],
            "actions": [],
        }
