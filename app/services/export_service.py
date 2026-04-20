from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _section_items(resume_json: dict[str, Any], section: str) -> list[dict[str, Any] | str]:
    items = resume_json.get(section)
    if isinstance(items, list):
        return items
    return []


def _skills_text(resume_json: dict[str, Any]) -> str:
    skills = resume_json.get("skills")
    if isinstance(skills, list):
        values = [_clean(item) for item in skills if _clean(item)]
        return ", ".join(values)
    if isinstance(skills, str):
        return _clean(skills)
    return ""


def _file_name_from_resume(resume_json: dict[str, Any], suffix: str) -> str:
    personal = resume_json.get("personal") if isinstance(resume_json.get("personal"), dict) else {}
    base = _clean(personal.get("name") if isinstance(personal, dict) else "") or "resume"
    safe = "".join(char if char.isalnum() else "_" for char in base).strip("_") or "resume"
    return f"{safe}.{suffix}"


def generate_pdf(resume_json: dict[str, Any]) -> tuple[str, str]:
    try:
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("reportlab is required for PDF export") from exc

    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        path = Path(tmp.name)

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    body_style = styles["BodyText"]
    muted_style = ParagraphStyle("Muted", parent=body_style, fontSize=10)

    doc = SimpleDocTemplate(
        str(path),
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    personal = resume_json.get("personal") if isinstance(resume_json.get("personal"), dict) else {}
    name = _clean(personal.get("name") if isinstance(personal, dict) else "") or "Resume"
    email = _clean(personal.get("email") if isinstance(personal, dict) else "")
    phone = _clean(personal.get("phone") if isinstance(personal, dict) else "")
    links = personal.get("links") if isinstance(personal, dict) else []

    contacts: list[str] = [value for value in [email, phone] if value]
    if isinstance(links, list):
        contacts.extend(_clean(link) for link in links if _clean(link))
    elif _clean(links):
        contacts.append(_clean(links))

    elements: list[Any] = [Paragraph(name, title_style)]
    if contacts:
        elements.append(Paragraph(" | ".join(contacts), muted_style))
    elements.append(Spacer(1, 10))

    summary = _clean(personal.get("summary") if isinstance(personal, dict) else resume_json.get("summary"))
    if summary:
        elements.append(Paragraph("Summary", heading_style))
        elements.append(Paragraph(summary, body_style))
        elements.append(Spacer(1, 8))

    def add_section(title: str, content: list[dict[str, Any] | str], fields: tuple[str, ...]) -> None:
        if not content:
            return
        elements.append(Paragraph(title, heading_style))
        for item in content:
            if isinstance(item, dict):
                heading_parts = [_clean(item.get(field)) for field in fields if _clean(item.get(field))]
                if heading_parts:
                    elements.append(Paragraph(" - ".join(heading_parts), body_style))
                description = _clean(item.get("description") or item.get("summary"))
                if description:
                    elements.append(Paragraph(description, body_style))
            else:
                text = _clean(item)
                if text:
                    elements.append(Paragraph(text, body_style))
            elements.append(Spacer(1, 4))
        elements.append(Spacer(1, 6))

    add_section("Experience", _section_items(resume_json, "experience"), ("title", "company", "duration"))
    add_section("Projects", _section_items(resume_json, "projects"), ("title", "company", "duration"))
    add_section("Education", _section_items(resume_json, "education"), ("institution", "degree", "year"))

    skills = _skills_text(resume_json)
    if skills:
        elements.append(Paragraph("Skills", heading_style))
        elements.append(Paragraph(skills, body_style))

    doc.build(elements)
    return str(path), _file_name_from_resume(resume_json, "pdf")


def generate_docx(resume_json: dict[str, Any]) -> tuple[str, str]:
    from docx import Document

    doc = Document()
    personal = resume_json.get("personal") if isinstance(resume_json.get("personal"), dict) else {}
    name = _clean(personal.get("name") if isinstance(personal, dict) else "") or "Resume"
    email = _clean(personal.get("email") if isinstance(personal, dict) else "")
    phone = _clean(personal.get("phone") if isinstance(personal, dict) else "")
    links = personal.get("links") if isinstance(personal, dict) else []

    doc.add_heading(name, level=0)
    contact_parts = [value for value in [email, phone] if value]
    if isinstance(links, list):
        contact_parts.extend(_clean(link) for link in links if _clean(link))
    elif _clean(links):
        contact_parts.append(_clean(links))
    if contact_parts:
        doc.add_paragraph(" | ".join(contact_parts))

    summary = _clean(personal.get("summary") if isinstance(personal, dict) else resume_json.get("summary"))
    if summary:
        doc.add_heading("Summary", level=1)
        doc.add_paragraph(summary)

    def add_docx_section(title: str, content: list[dict[str, Any] | str], fields: tuple[str, ...]) -> None:
        if not content:
            return
        doc.add_heading(title, level=1)
        for item in content:
            if isinstance(item, dict):
                heading_parts = [_clean(item.get(field)) for field in fields if _clean(item.get(field))]
                if heading_parts:
                    doc.add_paragraph(" - ".join(heading_parts))
                description = _clean(item.get("description") or item.get("summary"))
                if description:
                    doc.add_paragraph(description)
            else:
                text = _clean(item)
                if text:
                    doc.add_paragraph(text)

    add_docx_section("Experience", _section_items(resume_json, "experience"), ("title", "company", "duration"))
    add_docx_section("Projects", _section_items(resume_json, "projects"), ("title", "company", "duration"))
    add_docx_section("Education", _section_items(resume_json, "education"), ("institution", "degree", "year"))

    skills = _skills_text(resume_json)
    if skills:
        doc.add_heading("Skills", level=1)
        doc.add_paragraph(skills)

    with NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        doc.save(tmp.name)
        path = tmp.name

    return path, _file_name_from_resume(resume_json, "docx")