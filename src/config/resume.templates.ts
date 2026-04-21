export type CanonicalTemplateId =
  | "modern-minimal"
  | "classic-professional"
  | "compact-ats"
  | "two-column-modern"
  | "elegant-serif"
  | "clean-corporate"
  | "creative-soft"
  | "technical-dense"
  | "student-friendly"
  | "executive-style";

export type LegacyTemplateId =
  | "template1"
  | "template2"
  | "template3"
  | "template4"
  | "template6"
  | "ats-minimal"
  | "ats_minimal"
  | "modern"
  | "modern-clean"
  | "modern_clean"
  | "classic"
  | "technical-profile"
  | "technical_profile";

export type TemplateId = CanonicalTemplateId | LegacyTemplateId;

export interface ExperienceEntry {
  title: string;
  company: string;
  date: string;
  bullets: string[];
}

export interface ResumeTemplateData {
  name: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  education: string;
  skills: string[];
  role_type: string;
  experience: ExperienceEntry[];
}

export interface TemplateStyle {
  id: CanonicalTemplateId;
  name: string;
  description: string;
  category: "ats" | "professional" | "technical" | "executive" | "modern";
  fontFamily: {
    heading: string;
    body: string;
  };
  fontSize: {
    name: number;
    title: number;
    section: number;
    body: number;
  };
  colors: {
    text: string;
    accent: string;
    background: string;
    secondary: string;
  };
  lineHeight: number;
  layout: {
    columns: 1 | 2;
    headerStyle: "centered" | "left" | "compact";
    sectionBorder: boolean;
    skillsLayout: "list" | "tags" | "grouped";
  };
  recommendedFor: string[];
  html: string;
}

const BASE_TEMPLATE_HTML = `
<div class="resume" style="width:210mm; min-height:297mm; box-sizing:border-box; margin:0 auto; padding:12mm; background:{{background}}; color:{{textColor}}; font-family:{{bodyFont}}; line-height:{{lineHeight}};">
  <header style="margin-bottom:{{headerGap}}; text-align:{{headerAlign}}; border-bottom:{{headerBorder}}; padding-bottom:10px;">
    <h1 style="margin:0; font-family:{{headingFont}}; font-size:{{nameSize}}pt; color:{{accentColor}};">{{name}}</h1>
    {{title}}
    <p style="margin:6px 0 0 0; color:{{secondaryColor}}; font-size:{{bodySize}}pt;">{{contact}}</p>
  </header>
  <div style="display:{{gridDisplay}}; grid-template-columns:{{gridColumns}}; gap:14px; align-items:start;">
    <main>{{mainSections}}</main>
    <aside>{{sideSections}}</aside>
  </div>
</div>`;

const TEMPLATE_DEFINITIONS: Record<CanonicalTemplateId, TemplateStyle> = {
  "modern-minimal": {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Airy spacing, crisp hierarchy, and a calm editorial feel.",
    category: "modern",
    fontFamily: { heading: "Aptos, Arial, sans-serif", body: "Aptos, Arial, sans-serif" },
    fontSize: { name: 18, title: 11, section: 13, body: 10 },
    colors: { text: "#0f172a", accent: "#0f766e", background: "#ffffff", secondary: "#475569" },
    lineHeight: 1.45,
    layout: { columns: 1, headerStyle: "left", sectionBorder: true, skillsLayout: "tags" },
    recommendedFor: ["Modern roles", "General use", "Readable PDFs"],
    html: BASE_TEMPLATE_HTML,
  },
  "classic-professional": {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Centered serif presentation with traditional resume balance.",
    category: "professional",
    fontFamily: { heading: "Georgia, Times New Roman, serif", body: "Georgia, Times New Roman, serif" },
    fontSize: { name: 19, title: 11, section: 13, body: 10 },
    colors: { text: "#111827", accent: "#111827", background: "#ffffff", secondary: "#4b5563" },
    lineHeight: 1.5,
    layout: { columns: 1, headerStyle: "centered", sectionBorder: true, skillsLayout: "list" },
    recommendedFor: ["Corporate roles", "Traditional recruiters", "Balanced content"],
    html: BASE_TEMPLATE_HTML,
  },
  "compact-ats": {
    id: "compact-ats",
    name: "Compact ATS",
    description: "Dense, scanner-friendly structure that keeps everything text-first.",
    category: "ats",
    fontFamily: { heading: "Arial, sans-serif", body: "Arial, sans-serif" },
    fontSize: { name: 17, title: 11, section: 12, body: 9 },
    colors: { text: "#111111", accent: "#111111", background: "#ffffff", secondary: "#3f3f46" },
    lineHeight: 1.28,
    layout: { columns: 1, headerStyle: "compact", sectionBorder: false, skillsLayout: "grouped" },
    recommendedFor: ["ATS-first submissions", "High-volume applications", "Dense experience"],
    html: BASE_TEMPLATE_HTML,
  },
  "two-column-modern": {
    id: "two-column-modern",
    name: "Two-column Modern",
    description: "A split layout that gives summary and skills their own lane.",
    category: "modern",
    fontFamily: { heading: "Inter, Arial, sans-serif", body: "Inter, Arial, sans-serif" },
    fontSize: { name: 19, title: 11, section: 13, body: 10 },
    colors: { text: "#0f172a", accent: "#2563eb", background: "#ffffff", secondary: "#475569" },
    lineHeight: 1.42,
    layout: { columns: 2, headerStyle: "left", sectionBorder: false, skillsLayout: "tags" },
    recommendedFor: ["Product roles", "Design-minded applicants", "Modern portfolios"],
    html: BASE_TEMPLATE_HTML,
  },
  "elegant-serif": {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Refined serif typography with generous vertical rhythm.",
    category: "professional",
    fontFamily: { heading: "Garamond, Georgia, serif", body: "Garamond, Georgia, serif" },
    fontSize: { name: 20, title: 12, section: 14, body: 10 },
    colors: { text: "#1f2937", accent: "#7c2d12", background: "#fffdf9", secondary: "#6b7280" },
    lineHeight: 1.55,
    layout: { columns: 1, headerStyle: "centered", sectionBorder: true, skillsLayout: "list" },
    recommendedFor: ["Leadership", "Consulting", "Formal presentations"],
    html: BASE_TEMPLATE_HTML,
  },
  "clean-corporate": {
    id: "clean-corporate",
    name: "Clean Corporate",
    description: "Neutral, polished, and safe for general corporate screening.",
    category: "professional",
    fontFamily: { heading: "Helvetica, Arial, sans-serif", body: "Helvetica, Arial, sans-serif" },
    fontSize: { name: 18, title: 11, section: 13, body: 10 },
    colors: { text: "#0f172a", accent: "#1d4ed8", background: "#ffffff", secondary: "#475569" },
    lineHeight: 1.47,
    layout: { columns: 1, headerStyle: "left", sectionBorder: true, skillsLayout: "list" },
    recommendedFor: ["Finance", "Operations", "Corporate hiring"],
    html: BASE_TEMPLATE_HTML,
  },
  "creative-soft": {
    id: "creative-soft",
    name: "Creative Soft",
    description: "Gentle contrast and airy spacing for portfolio-friendly resumes.",
    category: "modern",
    fontFamily: { heading: "Aptos, Arial, sans-serif", body: "Aptos, Arial, sans-serif" },
    fontSize: { name: 19, title: 11, section: 13, body: 10 },
    colors: { text: "#1f2937", accent: "#be185d", background: "#fffafc", secondary: "#6b7280" },
    lineHeight: 1.46,
    layout: { columns: 2, headerStyle: "left", sectionBorder: false, skillsLayout: "tags" },
    recommendedFor: ["Creative roles", "Brand teams", "Portfolio-led applications"],
    html: BASE_TEMPLATE_HTML,
  },
  "technical-dense": {
    id: "technical-dense",
    name: "Technical Dense",
    description: "Compact engineering-first format optimized for signal density.",
    category: "technical",
    fontFamily: { heading: "Roboto, Arial, sans-serif", body: "Roboto, Arial, sans-serif" },
    fontSize: { name: 17, title: 11, section: 12, body: 9 },
    colors: { text: "#111827", accent: "#0f172a", background: "#ffffff", secondary: "#52525b" },
    lineHeight: 1.28,
    layout: { columns: 1, headerStyle: "compact", sectionBorder: false, skillsLayout: "grouped" },
    recommendedFor: ["Engineering", "Data", "Dense technical resumes"],
    html: BASE_TEMPLATE_HTML,
  },
  "student-friendly": {
    id: "student-friendly",
    name: "Student Friendly",
    description: "Friendly spacing and clear section breaks for early-career resumes.",
    category: "modern",
    fontFamily: { heading: "Inter, Arial, sans-serif", body: "Inter, Arial, sans-serif" },
    fontSize: { name: 18, title: 11, section: 13, body: 10 },
    colors: { text: "#0f172a", accent: "#0ea5e9", background: "#ffffff", secondary: "#64748b" },
    lineHeight: 1.52,
    layout: { columns: 1, headerStyle: "centered", sectionBorder: false, skillsLayout: "tags" },
    recommendedFor: ["Students", "Internships", "Early career"],
    html: BASE_TEMPLATE_HTML,
  },
  "executive-style": {
    id: "executive-style",
    name: "Executive Style",
    description: "Strong hierarchy and polished spacing for senior-level narratives.",
    category: "executive",
    fontFamily: { heading: "Cambria, Georgia, serif", body: "Cambria, Georgia, serif" },
    fontSize: { name: 20, title: 12, section: 14, body: 10 },
    colors: { text: "#111827", accent: "#111827", background: "#ffffff", secondary: "#4b5563" },
    lineHeight: 1.54,
    layout: { columns: 1, headerStyle: "left", sectionBorder: true, skillsLayout: "list" },
    recommendedFor: ["Executives", "Directors", "Leadership stories"],
    html: BASE_TEMPLATE_HTML,
  },
};

const TEMPLATE_ALIAS_MAP: Record<LegacyTemplateId, CanonicalTemplateId> = {
  template1: "classic-professional",
  template2: "modern-minimal",
  template3: "technical-dense",
  template4: "executive-style",
  template6: "compact-ats",
  "ats-minimal": "compact-ats",
  ats_minimal: "compact-ats",
  modern: "modern-minimal",
  "modern-clean": "modern-minimal",
  modern_clean: "modern-minimal",
  classic: "classic-professional",
  "technical-profile": "technical-dense",
  technical_profile: "technical-dense",
};

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/_/g, "-");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeResumeData(input: Partial<ResumeTemplateData> & Record<string, unknown>): ResumeTemplateData {
  const sections = Array.isArray(input.sections) ? (input.sections as Array<{ section?: string; bullets?: Array<{ content?: string }>; title?: string }>) : [];
  const experienceSection = sections.find((section) => section.section === "experience");
  const projectsSection = sections.find((section) => section.section === "projects");
  const skillsSection = sections.find((section) => section.section === "skills");
  const educationSection = sections.find((section) => section.section === "education");
  const header = (input.header as { name?: string; location?: string; email?: string; phone?: string; title?: string } | undefined) ?? {};

  const explicitExperience = Array.isArray(input.experience) ? (input.experience as ExperienceEntry[]) : [];
  const fallbackExperience: ExperienceEntry[] = (experienceSection?.bullets ?? []).map((bullet) => ({
    title: header.title ?? "Experience",
    company: "Organization",
    date: "",
    bullets: [bullet.content ?? ""],
  }));

  const fallbackProjects: ExperienceEntry[] = (projectsSection?.bullets ?? []).map((bullet) => ({
    title: `Projects: ${(bullet.content ?? "").split(":")[0]}`,
    company: "Project",
    date: "",
    bullets: [(bullet.content ?? "").includes(":") ? (bullet.content ?? "").split(":").slice(1).join(":").trim() : (bullet.content ?? "")],
  }));

  const rawSkills = input.skills as unknown;
  const normalizedSkills = Array.isArray(rawSkills)
    ? rawSkills.map((skill) => String(skill).trim()).filter(Boolean)
    : typeof rawSkills === "string"
      ? rawSkills.split(",").map((skill: string) => skill.trim()).filter(Boolean)
      : (skillsSection?.bullets ?? []).map((bullet) => bullet.content ?? "").filter(Boolean);

  return {
    name: input.name ?? header.name ?? "Your Name",
    location: input.location ?? header.location ?? "",
    email: input.email ?? header.email ?? "",
    phone: input.phone ?? header.phone ?? "",
    linkedin: input.linkedin ?? "",
    summary: input.summary ?? "",
    education:
      input.education ??
      (educationSection?.bullets ?? []).map((bullet) => bullet.content ?? "").filter(Boolean).join(" | "),
    skills: normalizedSkills,
    role_type: input.role_type ?? header.title ?? "general",
    experience: explicitExperience.length > 0 ? explicitExperience : [...fallbackExperience, ...fallbackProjects],
  };
}

function renderExperienceByTemplate(template: TemplateStyle, data: ResumeTemplateData): string {
  const items = data.experience.length > 0 ? data.experience : [{ title: "", company: "", date: "", bullets: [] }];

  return items
    .map((job) => {
      const bulletList = job.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("");
      if (template.layout.columns === 2) {
        return `
<div style="margin-bottom:10px;">
  <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">
    <strong>${escapeHtml(job.title)}</strong>
    <span style="font-size:${template.fontSize.body - 1}px;color:${template.colors.secondary};">${escapeHtml(job.date)}</span>
  </div>
  <div style="color:${template.colors.secondary};">${escapeHtml(job.company)}</div>
  ${bulletList ? `<ul style="margin:6px 0 0 18px;">${bulletList}</ul>` : ""}
</div>`;
      }

      return `
<div style="margin-bottom:10px;">
  <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">
    <strong>${escapeHtml(job.title)}</strong>
    <span style="font-size:${template.fontSize.body - 1}px;color:${template.colors.secondary};">${escapeHtml(job.date)}</span>
  </div>
  <div style="color:${template.colors.secondary};">${escapeHtml(job.company)}</div>
  ${bulletList ? `<ul style="margin:6px 0 0 18px;">${bulletList}</ul>` : ""}
</div>`;
    })
    .join("");
}

function renderSkills(template: TemplateStyle, skills: string[]): string {
  if (template.layout.columns === 2 || template.layout.skillsLayout === "tags") {
    return skills.map((skill) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 8px;border:1px solid ${template.colors.accent}33;border-radius:999px;">${escapeHtml(skill)}</span>`).join("");
  }

  if (template.layout.skillsLayout === "grouped") {
    return `<p style="margin:0;">${escapeHtml(skills.join(" · "))}</p>`;
  }

  return `<p style="margin:0;">${escapeHtml(skills.join(", "))}</p>`;
}

function buildTokens(template: TemplateStyle, data: ResumeTemplateData): Record<string, string> {
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join(" | ");
  const summary = data.summary ? `<section style="margin-bottom:12px;"><h2 style="margin:0 0 6px 0;font-size:${template.fontSize.section}px;color:${template.colors.accent};">Summary</h2><p style="margin:0;">${escapeHtml(data.summary)}</p></section>` : "";
  const education = data.education ? `<section style="margin-bottom:12px;"><h2 style="margin:0 0 6px 0;font-size:${template.fontSize.section}px;color:${template.colors.accent};">Education</h2><p style="margin:0;">${escapeHtml(data.education)}</p></section>` : "";
  const skills = data.skills.length > 0 ? `<section style="margin-bottom:12px;"><h2 style="margin:0 0 6px 0;font-size:${template.fontSize.section}px;color:${template.colors.accent};">Skills</h2>${renderSkills(template, data.skills)}</section>` : "";
  const experience = renderExperienceByTemplate(template, data);

  const mainSections = template.layout.columns === 2 ? `${experience}` : `${summary}${experience}${education}${skills}`;
  const sideSections = template.layout.columns === 2 ? `${summary}${education}${skills}` : "";

  return {
    name: escapeHtml(data.name),
    title: data.role_type ? `<p style="margin:4px 0 0 0;color:${template.colors.secondary};font-size:${template.fontSize.body}px;">${escapeHtml(data.role_type)}</p>` : "",
    contact: escapeHtml(contact),
    background: template.colors.background,
    textColor: template.colors.text,
    bodyFont: template.fontFamily.body,
    headingFont: template.fontFamily.heading,
    nameSize: String(template.fontSize.name),
    lineHeight: String(template.lineHeight),
    headerGap: template.layout.headerStyle === "compact" ? "8px" : "12px",
    headerAlign: template.layout.headerStyle === "centered" ? "center" : "left",
    headerBorder: template.layout.sectionBorder ? `1px solid ${template.colors.secondary}33` : "none",
    accentColor: template.colors.accent,
    secondaryColor: template.colors.secondary,
    bodySize: String(template.fontSize.body),
    gridDisplay: template.layout.columns === 2 ? "grid" : "block",
    gridColumns: template.layout.columns === 2 ? "minmax(0, 1.4fr) minmax(0, 0.6fr)" : "1fr",
    mainSections,
    sideSections,
  };
}

function renderWithTemplate(template: TemplateStyle, data: ResumeTemplateData): string {
  const tokens = buildTokens(template, data);
  return template.html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => tokens[key] ?? "");
}

export function select_template(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  const data = normalizeResumeData(resume_data);
  const experienceLength = data.experience.length;
  const skillsCount = data.skills.length;
  const roleType = data.role_type.toLowerCase();
  const totalBullets = data.experience.reduce((sum, item) => sum + item.bullets.length, 0);
  const bulletDensity = experienceLength > 0 ? totalBullets / experienceLength : 0;

  if (roleType.includes("director") || roleType.includes("vp") || roleType.includes("head") || roleType.includes("chief")) {
    return "executive-style";
  }

  if (roleType.includes("engineer") || roleType.includes("developer") || roleType.includes("architect") || skillsCount >= 12 || bulletDensity >= 4) {
    return "technical-dense";
  }

  if (skillsCount >= 10 && experienceLength >= 2) {
    return "two-column-modern";
  }

  if (experienceLength <= 1 || bulletDensity <= 1.5) {
    return "compact-ats";
  }

  if (roleType.includes("product") || roleType.includes("design") || roleType.includes("marketing")) {
    return "modern-minimal";
  }

  return "classic-professional";
}

export function suggest_template(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  return select_template(resume_data);
}

export function suggestTemplate(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  return suggest_template(resume_data);
}

export function render_template(template_id: TemplateId, resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): string {
  const data = normalizeResumeData(resume_data);
  const resolvedId = normalizeKey(template_id) in TEMPLATE_DEFINITIONS ? (normalizeKey(template_id) as CanonicalTemplateId) : TEMPLATE_ALIAS_MAP[template_id as LegacyTemplateId] ?? "modern-minimal";
  const template = TEMPLATE_DEFINITIONS[resolvedId];
  return renderWithTemplate(template, data);
}

export function renderTemplate(templateId: TemplateId, resumeData: Partial<ResumeTemplateData> & Record<string, unknown>): string {
  return render_template(templateId, resumeData);
}

export function switch_template(template_id: TemplateId, resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): string {
  return render_template(template_id, resume_data);
}

export function getTemplateById(id: string): TemplateStyle | undefined {
  const normalized = normalizeKey(id);
  const canonical = (normalized in TEMPLATE_DEFINITIONS ? normalized : TEMPLATE_ALIAS_MAP[normalized as LegacyTemplateId]) as CanonicalTemplateId | undefined;
  return canonical ? TEMPLATE_DEFINITIONS[canonical] : undefined;
}

export function getAllTemplates(): TemplateStyle[] {
  return Object.values(TEMPLATE_DEFINITIONS);
}

export const resumeTemplates: Record<TemplateId, (data: Partial<ResumeTemplateData> & Record<string, unknown>) => string> = {
  "modern-minimal": (data) => render_template("modern-minimal", data),
  "classic-professional": (data) => render_template("classic-professional", data),
  "compact-ats": (data) => render_template("compact-ats", data),
  "two-column-modern": (data) => render_template("two-column-modern", data),
  "elegant-serif": (data) => render_template("elegant-serif", data),
  "clean-corporate": (data) => render_template("clean-corporate", data),
  "creative-soft": (data) => render_template("creative-soft", data),
  "technical-dense": (data) => render_template("technical-dense", data),
  "student-friendly": (data) => render_template("student-friendly", data),
  "executive-style": (data) => render_template("executive-style", data),
  template1: (data) => render_template("classic-professional", data),
  template2: (data) => render_template("modern-minimal", data),
  template3: (data) => render_template("technical-dense", data),
  template4: (data) => render_template("executive-style", data),
  template6: (data) => render_template("compact-ats", data),
  "ats-minimal": (data) => render_template("compact-ats", data),
  ats_minimal: (data) => render_template("compact-ats", data),
  modern: (data) => render_template("modern-minimal", data),
  "modern-clean": (data) => render_template("modern-minimal", data),
  modern_clean: (data) => render_template("modern-minimal", data),
  classic: (data) => render_template("classic-professional", data),
  "technical-profile": (data) => render_template("technical-dense", data),
  technical_profile: (data) => render_template("technical-dense", data),
};
