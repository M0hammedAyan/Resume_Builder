from __future__ import annotations

import os
import importlib
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
from uuid import UUID

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from app.models.generated_output import GeneratedOutput
from app.models.structured_event import StructuredEvent
from app.models.user import User

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = BASE_DIR / "templates" / "resume"

TEMPLATE_MAP = {
    "ats-minimal": "ats_minimal.html",
    "ats_minimal": "ats_minimal.html",
    "modern-clean": "modern_clean.html",
    "modern_clean": "modern_clean.html",
    "technical-profile": "technical_profile.html",
    "technical_profile": "technical_profile.html",
}


env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def _build_resume_data(db: Session, user_id: UUID) -> dict[str, Any]:
    """Assemble resume data payload from latest generated output and fallback events."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    latest_output = (
        db.query(GeneratedOutput)
        .filter(GeneratedOutput.user_id == user_id, GeneratedOutput.output_type == "resume")
        .order_by(GeneratedOutput.created_at.desc())
        .first()
    )

    events_query = (
        db.query(StructuredEvent)
        .filter(StructuredEvent.user_id == user_id)
        .order_by(StructuredEvent.timestamp.desc())
        .limit(5)
        .all()
    )

    fallback_events = [
        {
            "id": str(item.id),
            "role_context": item.role_context,
            "domain": item.domain,
            "action": item.action,
            "tools": item.tools,
        }
        for item in events_query
    ]

    if latest_output and isinstance(latest_output.content, dict):
        content = latest_output.content
        bullets = [str(bullet) for bullet in content.get("bullets", []) if str(bullet).strip()]
        selected_events = content.get("selected_events", fallback_events)
        evaluation = content.get("evaluation", {})
        ats_score = float(evaluation.get("overall_score", latest_output.ats_score))
    else:
        bullets = [item["action"] for item in fallback_events]
        selected_events = fallback_events
        ats_score = 0.0

    summary = (
        "Built measurable outcomes across product, analytics, and engineering contexts with a focus on scalable impact."
    )

    return {
        "user": {
            "name": user.name,
            "email": user.email,
            "experience_level": user.experience_level,
        },
        "target_roles": user.target_roles or [],
        "summary": summary,
        "bullets": bullets,
        "events": selected_events,
        "ats_score": round(ats_score, 2),
    }


def render_resume(template_name: str, data: dict[str, Any]) -> str:
    """Render resume HTML from a named Jinja2 template and structured data."""
    template_key = template_name.strip().lower()
    template_file = TEMPLATE_MAP.get(template_key)
    if not template_file:
        raise ValueError("Unknown template. Use ats-minimal, modern-clean, or technical-profile")
    template = env.get_template(template_file)
    return template.render(**data)


def export_resume_pdf(db: Session, user_id: UUID, template_name: str) -> tuple[str, str]:
    """Render selected template and export to PDF using WeasyPrint."""
    try:
        from weasyprint import HTML
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("WeasyPrint is not available. Install dependencies and system libraries.") from exc

    data = _build_resume_data(db, user_id)
    html = render_resume(template_name, data)

    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        HTML(string=html).write_pdf(tmp.name)
        file_path = tmp.name

    download_name = f"careeros_{user_id}_resume.pdf"
    return file_path, download_name


def export_resume_docx(db: Session, user_id: UUID, template_name: str) -> tuple[str, str]:
    """Export resume to DOCX using python-docx with template-aware section styling."""
    try:
        Document = getattr(importlib.import_module("docx"), "Document")
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("python-docx is not available. Install required dependencies.") from exc

    data = _build_resume_data(db, user_id)
    doc = Document()

    user = data["user"]
    doc.add_heading(user.get("name") or "CareerOS Candidate", 0)
    meta = " | ".join([value for value in [user.get("email"), user.get("experience_level")] if value])
    if meta:
        doc.add_paragraph(meta)

    if data.get("target_roles"):
        doc.add_paragraph("Target Roles: " + ", ".join(data["target_roles"]))

    doc.add_heading("Summary", level=1)
    doc.add_paragraph(str(data.get("summary", "")))

    if template_name.lower() == "technical-profile":
        doc.add_heading("Technical Event Context", level=1)
        for event in data.get("events", []):
            line = f"[{event.get('domain', 'General')}] {event.get('action', '')}"
            doc.add_paragraph(line)

    doc.add_heading("Selected Achievements", level=1)
    for bullet in data.get("bullets", []):
        doc.add_paragraph(str(bullet), style="List Bullet")

    doc.add_paragraph(f"ATS Score: {data.get('ats_score', 0)}")

    with NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        doc.save(tmp.name)
        file_path = tmp.name

    download_name = f"careeros_{user_id}_resume.docx"
    return file_path, download_name


def cleanup_export_file(path: str) -> None:
    """Delete temporary exported file after response has been sent."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
