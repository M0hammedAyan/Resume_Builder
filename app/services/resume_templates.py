from __future__ import annotations

from dataclasses import asdict, dataclass
from html import escape
from typing import Any, Literal

TemplateLayout = Literal["single-column", "two-column"]
HeaderStyle = Literal["centered", "left", "compact"]
SkillsStyle = Literal["list", "tags", "grouped"]

DEFAULT_TEMPLATE_ID = "modern-minimal"

LEGACY_TEMPLATE_ALIASES: dict[str, str] = {
    "template1": "classic-professional",
    "template2": "modern-minimal",
    "template3": "technical-dense",
    "template4": "executive-style",
    "template6": "compact-ats",
    "ats-minimal": "compact-ats",
    "ats_minimal": "compact-ats",
    "classic": "classic-professional",
    "modern": "modern-minimal",
    "modern-clean": "modern-minimal",
    "modern_clean": "modern-minimal",
    "technical-profile": "technical-dense",
    "technical_profile": "technical-dense",
}


@dataclass(frozen=True)
class TemplateSpec:
    id: str
    name: str
    description: str
    category: str
    font_family_heading: str
    font_family_body: str
    font_size_name: int
    font_size_heading: int
    font_size_body: int
    layout: TemplateLayout
    header_style: HeaderStyle
    section_border: bool
    skills_style: SkillsStyle
    accent_color: str
    text_color: str
    secondary_color: str
    background_color: str
    page_padding_mm: int
    line_height: float
    column_ratio: float
    recommended_for: list[str]


TEMPLATE_LIBRARY: dict[str, TemplateSpec] = {
    "modern-minimal": TemplateSpec(
        id="modern-minimal",
        name="Modern Minimal",
        description="Open spacing, clean hierarchy, and a calm editorial feel.",
        category="modern",
        font_family_heading="Aptos, Arial, sans-serif",
        font_family_body="Aptos, Arial, sans-serif",
        font_size_name=18,
        font_size_heading=13,
        font_size_body=10,
        layout="single-column",
        header_style="left",
        section_border=True,
        skills_style="tags",
        accent_color="#0f766e",
        text_color="#0f172a",
        secondary_color="#475569",
        background_color="#ffffff",
        page_padding_mm=13,
        line_height=1.45,
        column_ratio=0.34,
        recommended_for=["Modern roles", "General professional use", "Readable PDFs"],
    ),
    "classic-professional": TemplateSpec(
        id="classic-professional",
        name="Classic Professional",
        description="Centered serif layout with formal resume conventions.",
        category="professional",
        font_family_heading="Georgia, Times New Roman, serif",
        font_family_body="Georgia, Times New Roman, serif",
        font_size_name=19,
        font_size_heading=13,
        font_size_body=10,
        layout="single-column",
        header_style="centered",
        section_border=True,
        skills_style="list",
        accent_color="#111827",
        text_color="#111827",
        secondary_color="#4b5563",
        background_color="#ffffff",
        page_padding_mm=12,
        line_height=1.5,
        column_ratio=0.34,
        recommended_for=["Corporate applications", "Traditional recruiters", "Balanced content"],
    ),
    "compact-ats": TemplateSpec(
        id="compact-ats",
        name="Compact ATS",
        description="Dense, scanner-friendly structure that keeps everything text-first.",
        category="ats",
        font_family_heading="Arial, sans-serif",
        font_family_body="Arial, sans-serif",
        font_size_name=17,
        font_size_heading=12,
        font_size_body=9,
        layout="single-column",
        header_style="compact",
        section_border=False,
        skills_style="grouped",
        accent_color="#111111",
        text_color="#111111",
        secondary_color="#3f3f46",
        background_color="#ffffff",
        page_padding_mm=10,
        line_height=1.28,
        column_ratio=0.34,
        recommended_for=["ATS-first submissions", "High-volume applications", "Dense experience"],
    ),
    "two-column-modern": TemplateSpec(
        id="two-column-modern",
        name="Two-column Modern",
        description="A modern split layout that gives skills and summary their own lane.",
        category="modern",
        font_family_heading="Inter, Arial, sans-serif",
        font_family_body="Inter, Arial, sans-serif",
        font_size_name=19,
        font_size_heading=13,
        font_size_body=10,
        layout="two-column",
        header_style="left",
        section_border=False,
        skills_style="tags",
        accent_color="#2563eb",
        text_color="#0f172a",
        secondary_color="#475569",
        background_color="#ffffff",
        page_padding_mm=12,
        line_height=1.42,
        column_ratio=0.31,
        recommended_for=["Product roles", "Design-minded applicants", "Modern portfolios"],
    ),
    "elegant-serif": TemplateSpec(
        id="elegant-serif",
        name="Elegant Serif",
        description="Refined serif typography with generous vertical rhythm.",
        category="professional",
        font_family_heading="Garamond, Georgia, serif",
        font_family_body="Garamond, Georgia, serif",
        font_size_name=20,
        font_size_heading=14,
        font_size_body=10,
        layout="single-column",
        header_style="centered",
        section_border=True,
        skills_style="list",
        accent_color="#7c2d12",
        text_color="#1f2937",
        secondary_color="#6b7280",
        background_color="#fffdf9",
        page_padding_mm=13,
        line_height=1.55,
        column_ratio=0.34,
        recommended_for=["Leadership", "Consulting", "Formal presentations"],
    ),
    "clean-corporate": TemplateSpec(
        id="clean-corporate",
        name="Clean Corporate",
        description="Neutral, polished, and safe for general corporate screening.",
        category="professional",
        font_family_heading="Helvetica, Arial, sans-serif",
        font_family_body="Helvetica, Arial, sans-serif",
        font_size_name=18,
        font_size_heading=13,
        font_size_body=10,
        layout="single-column",
        header_style="left",
        section_border=True,
        skills_style="list",
        accent_color="#1d4ed8",
        text_color="#0f172a",
        secondary_color="#475569",
        background_color="#ffffff",
        page_padding_mm=12,
        line_height=1.47,
        column_ratio=0.34,
        recommended_for=["Finance", "Operations", "Corporate hiring"],
    ),
    "creative-soft": TemplateSpec(
        id="creative-soft",
        name="Creative Soft",
        description="Gentle contrast and airy spacing for portfolio-friendly resumes.",
        category="modern",
        font_family_heading="Aptos, Arial, sans-serif",
        font_family_body="Aptos, Arial, sans-serif",
        font_size_name=19,
        font_size_heading=13,
        font_size_body=10,
        layout="two-column",
        header_style="left",
        section_border=False,
        skills_style="tags",
        accent_color="#be185d",
        text_color="#1f2937",
        secondary_color="#6b7280",
        background_color="#fffafc",
        page_padding_mm=12,
        line_height=1.46,
        column_ratio=0.33,
        recommended_for=["Creative roles", "Brand teams", "Portfolio-led applications"],
    ),
    "technical-dense": TemplateSpec(
        id="technical-dense",
        name="Technical Dense",
        description="Compact engineering-first format optimized for signal density.",
        category="technical",
        font_family_heading="Roboto, Arial, sans-serif",
        font_family_body="Roboto, Arial, sans-serif",
        font_size_name=17,
        font_size_heading=12,
        font_size_body=9,
        layout="single-column",
        header_style="compact",
        section_border=False,
        skills_style="grouped",
        accent_color="#0f172a",
        text_color="#111827",
        secondary_color="#52525b",
        background_color="#ffffff",
        page_padding_mm=10,
        line_height=1.28,
        column_ratio=0.34,
        recommended_for=["Engineering", "Data", "Dense technical resumes"],
    ),
    "student-friendly": TemplateSpec(
        id="student-friendly",
        name="Student Friendly",
        description="Friendly spacing and clear section breaks for early-career resumes.",
        category="modern",
        font_family_heading="Inter, Arial, sans-serif",
        font_family_body="Inter, Arial, sans-serif",
        font_size_name=18,
        font_size_heading=13,
        font_size_body=10,
        layout="single-column",
        header_style="centered",
        section_border=False,
        skills_style="tags",
        accent_color="#0ea5e9",
        text_color="#0f172a",
        secondary_color="#64748b",
        background_color="#ffffff",
        page_padding_mm=13,
        line_height=1.52,
        column_ratio=0.34,
        recommended_for=["Students", "Internships", "Early career"],
    ),
    "executive-style": TemplateSpec(
        id="executive-style",
        name="Executive Style",
        description="Strong hierarchy and polished spacing for senior-level narratives.",
        category="executive",
        font_family_heading="Cambria, Georgia, serif",
        font_family_body="Cambria, Georgia, serif",
        font_size_name=20,
        font_size_heading=14,
        font_size_body=10,
        layout="single-column",
        header_style="left",
        section_border=True,
        skills_style="list",
        accent_color="#111827",
        text_color="#111827",
        secondary_color="#4b5563",
        background_color="#ffffff",
        page_padding_mm=13,
        line_height=1.54,
        column_ratio=0.34,
        recommended_for=["Executives", "Directors", "Leadership stories"],
    ),
}


def normalize_template_id(template_id: str | None) -> str:
    if not template_id:
        return DEFAULT_TEMPLATE_ID

    normalized = template_id.strip().lower().replace("_", "-")
    return LEGACY_TEMPLATE_ALIASES.get(normalized, normalized if normalized in TEMPLATE_LIBRARY else DEFAULT_TEMPLATE_ID)


def get_template_spec(template_id: str | None) -> TemplateSpec:
    return TEMPLATE_LIBRARY[normalize_template_id(template_id)]


def list_resume_templates() -> list[dict[str, Any]]:
    templates: list[dict[str, Any]] = []
    for template in TEMPLATE_LIBRARY.values():
        payload = asdict(template)
        payload.pop("html", None)
        payload["fontFamily"] = {
            "heading": template.font_family_heading,
            "body": template.font_family_body,
        }
        payload["fontSize"] = {
            "name": template.font_size_name,
            "heading": template.font_size_heading,
            "section": template.font_size_heading,
            "body": template.font_size_body,
        }
        payload["layout"] = {
            "columns": 2 if template.layout == "two-column" else 1,
            "headerStyle": template.header_style,
            "sectionBorder": template.section_border,
            "skillsLayout": template.skills_style,
        }
        templates.append(payload)
    return templates


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return []


def _get_personal(resume_json: dict[str, Any]) -> dict[str, Any]:
    personal = resume_json.get("personal") if isinstance(resume_json.get("personal"), dict) else {}
    return personal if isinstance(personal, dict) else {}


def _section_items(resume_json: dict[str, Any], section: str) -> list[Any]:
    items = resume_json.get(section)
    if isinstance(items, list):
        return items
    return []


def _render_skill_block(skills: list[str], template: TemplateSpec) -> str:
    if not skills:
        return ""

    if template.skills_style == "tags":
        return "".join(
            f'<span class="skill-chip">{escape(skill)}</span>'
            for skill in skills
        )

    if template.skills_style == "grouped":
        return f'<p class="section-text">{escape(" · ".join(skills))}</p>'

    return "<ul class=\"plain-list\">" + "".join(f"<li>{escape(skill)}</li>" for skill in skills) + "</ul>"


def _render_bullets(entry: dict[str, Any]) -> str:
    bullets = [str(item).strip() for item in _as_list(entry.get("bullets")) if str(item).strip()]
    if not bullets:
        description = _clean(entry.get("description") or entry.get("summary"))
        bullets = [description] if description else []
    if not bullets:
        return ""

    return "<ul class=\"entry-bullets\">" + "".join(f"<li>{escape(item)}</li>" for item in bullets) + "</ul>"


def _render_entry(entry: Any, template: TemplateSpec, kind: str) -> str:
    if isinstance(entry, str):
        text = _clean(entry)
        return f'<p class="section-text">{escape(text)}</p>' if text else ""

    if not isinstance(entry, dict):
        return ""

    primary_fields: list[str]
    secondary_fields: list[str]

    if kind == "education":
        primary_fields = ["institution", "degree"]
        secondary_fields = ["year", "duration"]
    else:
        primary_fields = ["title", "institution"]
        secondary_fields = ["company", "duration", "year"]

    primary = next((_clean(entry.get(field)) for field in primary_fields if _clean(entry.get(field))), "")
    secondary = [
        _clean(entry.get(field))
        for field in secondary_fields
        if _clean(entry.get(field))
    ]

    meta = " · ".join(secondary)
    details = _render_bullets(entry)
    description = _clean(entry.get("description") or entry.get("summary"))
    link = _clean(entry.get("link") or entry.get("url"))

    parts = ['<article class="resume-entry">']
    if primary or meta:
        parts.append('<div class="entry-head">')
        if primary:
            parts.append(f'<div class="entry-primary">{escape(primary)}</div>')
        if meta:
            parts.append(f'<div class="entry-meta">{escape(meta)}</div>')
        parts.append('</div>')
    if description:
        parts.append(f'<p class="section-text">{escape(description)}</p>')
    if link:
        parts.append(f'<p class="section-link">{escape(link)}</p>')
    if details:
        parts.append(details)
    parts.append('</article>')
    return "".join(parts)


def _render_section(title: str, items: list[Any], template: TemplateSpec, kind: str) -> str:
    rendered = [item for item in (_render_entry(entry, template, kind) for entry in items) if item]
    if not rendered:
        return ""

    border_class = " section-bordered" if template.section_border else ""
    return (
        f'<section class="resume-section{border_class}">' 
        f'<h2>{escape(title)}</h2>'
        + "".join(rendered)
        + "</section>"
    )


def _render_optional_section(section: dict[str, Any], template: TemplateSpec) -> str:
    title = _clean(section.get("title")) or _clean(section.get("key")) or "Additional Section"
    items = section.get("items") if isinstance(section.get("items"), list) else []
    rendered_items = []
    for item in items:
        text = _clean(item)
        if text:
            rendered_items.append(f"<li>{escape(text)}</li>")
    if not rendered_items:
        return ""

    border_class = " section-bordered" if template.section_border else ""
    return (
        f'<section class="resume-section{border_class}">' 
        f'<h2>{escape(title)}</h2>'
        + '<ul class="plain-list">'
        + "".join(rendered_items)
        + "</ul></section>"
    )


def build_resume_payload(resume_json: dict[str, Any]) -> dict[str, Any]:
    personal = _get_personal(resume_json)
    summary = _clean(personal.get("summary") or resume_json.get("summary"))
    contact_links = _as_list(personal.get("links") or resume_json.get("links"))

    return {
        "name": _clean(personal.get("name") or resume_json.get("name")) or "Resume",
        "title": _clean(personal.get("title") or resume_json.get("title")),
        "location": _clean(personal.get("location") or resume_json.get("location")),
        "email": _clean(personal.get("email") or resume_json.get("email")),
        "phone": _clean(personal.get("phone") or resume_json.get("phone")),
        "links": [str(item).strip() for item in contact_links if str(item).strip()],
        "summary": summary,
        "experience": _section_items(resume_json, "experience"),
        "projects": _section_items(resume_json, "projects"),
        "education": _section_items(resume_json, "education"),
        "skills": [str(item).strip() for item in _as_list(resume_json.get("skills")) if str(item).strip()],
        "optional_sections": [section for section in _as_list(resume_json.get("optional_sections")) if isinstance(section, dict)],
    }


def render_resume_html(template_id: str | None, resume_json: dict[str, Any]) -> str:
    template = get_template_spec(template_id)
    payload = build_resume_payload(resume_json)
    main_column_ratio = f"{(1 - template.column_ratio):.2f}"
    side_column_ratio = f"{template.column_ratio:.2f}"

    contact_parts = [part for part in [payload["email"], payload["phone"], payload["location"]] if part]
    contact_parts.extend(payload["links"])

    header_style = {
        "centered": "center",
        "left": "left",
        "compact": "left",
    }[template.header_style]

    css = f"""
@page {{ size: A4; margin: 0; }}
html, body {{ margin: 0; padding: 0; background: {template.background_color}; }}
body {{ font-family: {template.font_family_body}; color: {template.text_color}; line-height: {template.line_height}; }}
.resume-page {{ width: 210mm; min-height: 297mm; box-sizing: border-box; padding: {template.page_padding_mm}mm; margin: 0 auto; background: {template.background_color}; }}
.resume-header {{ margin-bottom: 12px; text-align: {header_style}; }}
.resume-name {{ margin: 0; font-family: {template.font_family_heading}; font-size: {template.font_size_name}pt; color: {template.accent_color}; letter-spacing: 0.2px; }}
.resume-title {{ margin: 2px 0 0 0; color: {template.secondary_color}; font-size: {template.font_size_body}pt; }}
.resume-contact {{ margin: 6px 0 0 0; color: {template.secondary_color}; font-size: {template.font_size_body}pt; }}
.resume-grid {{ display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; }}
.resume-grid.two-column {{ grid-template-columns: minmax(0, {main_column_ratio}fr) minmax(0, {side_column_ratio}fr); gap: 14px; align-items: start; }}
.resume-section {{ margin-bottom: 12px; }}
.resume-section h2 {{ margin: 0 0 6px 0; font-family: {template.font_family_heading}; font-size: {template.font_size_heading}pt; color: {template.accent_color}; letter-spacing: 0.2px; }}
.section-bordered {{ padding-top: 8px; border-top: 1px solid color-mix(in srgb, {template.secondary_color} 35%, transparent); }}
.resume-entry {{ margin-bottom: 10px; }}
.entry-head {{ display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; align-items: baseline; }}
.entry-primary {{ font-weight: 700; }}
.entry-meta {{ color: {template.secondary_color}; font-size: {template.font_size_body - 1}pt; text-align: right; }}
.section-text {{ margin: 0 0 6px 0; font-size: {template.font_size_body}pt; }}
.section-link {{ margin: 0 0 6px 0; color: {template.accent_color}; font-size: {template.font_size_body - 1}pt; }}
.entry-bullets {{ margin: 6px 0 0 18px; padding: 0; }}
.entry-bullets li {{ margin-bottom: 4px; font-size: {template.font_size_body}pt; }}
.plain-list {{ margin: 0; padding-left: 18px; }}
.plain-list li {{ margin-bottom: 4px; font-size: {template.font_size_body}pt; }}
.skill-chip {{ display: inline-block; margin: 0 6px 6px 0; padding: 4px 8px; border: 1px solid color-mix(in srgb, {template.accent_color} 30%, transparent); border-radius: 999px; color: {template.text_color}; font-size: {template.font_size_body - 1}pt; }}
.two-column .resume-section {{ margin-bottom: 10px; }}
.tone-card {{ display: inline-block; margin-top: 4px; color: {template.secondary_color}; }}
"""

    summary_html = ""
    if payload["summary"]:
        summary_html = f'<section class="resume-section{(" section-bordered" if template.section_border else "")}"><h2>Summary</h2><p class="section-text">{escape(payload["summary"])}</p></section>'

    experience_html = _render_section("Experience", payload["experience"], template, "experience")
    projects_html = _render_section("Projects", payload["projects"], template, "projects")
    education_html = _render_section("Education", payload["education"], template, "education")
    skills_html = ""
    if payload["skills"]:
        skills_html = f'<section class="resume-section{(" section-bordered" if template.section_border else "")}"><h2>Skills</h2>{_render_skill_block(payload["skills"], template)}</section>'

    optional_html = "".join(_render_optional_section(section, template) for section in payload["optional_sections"])

    if template.layout == "two-column":
        main_sections = "".join(part for part in [experience_html, projects_html, optional_html] if part)
        side_sections = "".join(part for part in [summary_html, education_html, skills_html] if part)
        body_html = (
            '<div class="resume-grid two-column">'
            f'<div class="resume-main">{main_sections}</div>'
            f'<aside class="resume-aside">{side_sections}</aside>'
            '</div>'
        )
    else:
        body_html = "".join(part for part in [summary_html, experience_html, projects_html, education_html, skills_html, optional_html] if part)

    header_html = [
        '<header class="resume-header">',
        f'<h1 class="resume-name">{escape(payload["name"])}</h1>',
    ]
    if payload["title"]:
        header_html.append(f'<p class="resume-title">{escape(payload["title"])}</p>')
    if contact_parts:
        header_html.append(f'<p class="resume-contact">{escape(" | ".join(contact_parts))}</p>')
    header_html.append('</header>')

    return (
        "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8' />"
        f"<style>{css}</style></head><body><main class='resume-page {template.id}'>{''.join(header_html)}{body_html}</main></body></html>"
    )


def render_resume_docx_sections(template_id: str | None, resume_json: dict[str, Any]) -> dict[str, Any]:
    template = get_template_spec(template_id)
    return {"template": template, "payload": build_resume_payload(resume_json)}
