export type TemplateId =
  | "template1"
  | "template2"
  | "template3"
  | "template4"
  | "template6";

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
  id: TemplateId;
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

const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateStyle> = {
  template1: {
    id: "template1",
    name: "Classic Professional",
    description: "Centered header and serif presentation",
    category: "professional",
    fontFamily: { heading: "Georgia", body: "Times New Roman" },
    fontSize: { name: 28, title: 12, section: 16, body: 13 },
    colors: {
      text: "#111111",
      accent: "#111111",
      background: "#ffffff",
      secondary: "#444444",
    },
    lineHeight: 1.45,
    layout: { columns: 1, headerStyle: "centered", sectionBorder: true, skillsLayout: "list" },
    recommendedFor: ["Corporate roles", "General use", "Balanced content"],
    html: `
<div class="resume template1" style="font-family: Georgia, 'Times New Roman', serif; color: #111; width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 12mm; margin: 0 auto; line-height: 1.45; background: #fff;">
  <header style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 14px;">
    <h1 style="font-size: 28px; margin: 0;">{{name}}</h1>
    <p style="margin: 6px 0 0 0;">{{location}} | {{email}} | {{phone}}</p>
  </header>
  <section style="margin-bottom: 12px;"><h2 style="font-size: 16px; margin-bottom: 6px;">• Professional Summary</h2><p style="margin: 0;">{{summary}}</p></section>
  <section style="margin-bottom: 12px;"><h2 style="font-size: 16px; margin-bottom: 6px;">• Experience</h2>{{experience}}</section>
  <section style="margin-bottom: 12px;"><h2 style="font-size: 16px; margin-bottom: 6px;">• Education</h2><p style="margin: 0;">{{education}}</p></section>
  <section><h2 style="font-size: 16px; margin-bottom: 6px;">• Skills</h2><p style="margin: 0;">{{skills}}</p></section>
</div>`,
  },
  template2: {
    id: "template2",
    name: "Modern Blue",
    description: "Clean spacing with blue heading accents",
    category: "modern",
    fontFamily: { heading: "Inter", body: "Inter" },
    fontSize: { name: 28, title: 12, section: 15, body: 13 },
    colors: {
      text: "#0f172a",
      accent: "#2563eb",
      background: "#ffffff",
      secondary: "#64748b",
    },
    lineHeight: 1.5,
    layout: { columns: 1, headerStyle: "left", sectionBorder: true, skillsLayout: "tags" },
    recommendedFor: ["Tech roles", "Product roles", "Readable modern style"],
    html: `
<div class="resume template2" style="font-family: Inter, Arial, sans-serif; color: #0f172a; width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 12mm; margin: 0 auto; line-height: 1.5; background: #fff;">
  <header style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 14px;">
    <h1 style="color: #2563eb; font-size: 28px; margin: 0;">{{name}}</h1>
    <p style="margin: 6px 0 0 0;">{{location}} | {{email}} | {{phone}}</p>
  </header>
  <section style="margin-bottom: 12px;"><h2 style="color: #2563eb; margin-bottom: 6px;">• Summary</h2><p style="margin: 0;">{{summary}}</p></section>
  <section style="margin-bottom: 12px;"><h2 style="color: #2563eb; margin-bottom: 6px;">• Experience</h2>{{experience}}</section>
  <section style="margin-bottom: 12px;"><h2 style="color: #2563eb; margin-bottom: 6px;">• Education</h2><p style="margin: 0;">{{education}}</p></section>
  <section><h2 style="color: #2563eb; margin-bottom: 6px;">• Skills</h2><p style="margin: 0;">{{skills}}</p></section>
</div>`,
  },
  template3: {
    id: "template3",
    name: "Technical Dense",
    description: "Compact ATS-friendly layout for technical resumes",
    category: "technical",
    fontFamily: { heading: "Arial", body: "Arial" },
    fontSize: { name: 22, title: 12, section: 14, body: 12 },
    colors: {
      text: "#111111",
      accent: "#111111",
      background: "#ffffff",
      secondary: "#444444",
    },
    lineHeight: 1.35,
    layout: { columns: 1, headerStyle: "compact", sectionBorder: false, skillsLayout: "grouped" },
    recommendedFor: ["Engineering", "ATS filtering", "Dense resumes"],
    html: `
<div class="resume template3" style="font-family: Arial, sans-serif; color: #111; width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 10mm 12mm; margin: 0 auto; font-size: 13px; line-height: 1.35; background: #fff;">
  <header style="margin-bottom: 12px;">
    <h1 style="margin: 0; font-size: 22px;">{{name}}</h1>
    <p style="margin: 5px 0 0 0;">{{email}} | {{phone}} | {{linkedin}}</p>
  </header>
  <section style="margin-bottom: 10px;"><h3 style="margin-bottom: 4px;">• Summary</h3><p style="margin: 0;">{{summary}}</p></section>
  <section style="margin-bottom: 10px;"><h3 style="margin-bottom: 4px;">• Experience</h3>{{experience}}</section>
  <section style="margin-bottom: 10px;"><h3 style="margin-bottom: 4px;">• Education</h3><p style="margin: 0;">{{education}}</p></section>
  <section><h3 style="margin-bottom: 4px;">• Skills</h3><p style="margin: 0;">{{skills}}</p></section>
</div>`,
  },
  template4: {
    id: "template4",
    name: "Executive Clean",
    description: "Leadership-oriented layout with strong hierarchy",
    category: "executive",
    fontFamily: { heading: "Cambria", body: "Cambria" },
    fontSize: { name: 32, title: 13, section: 17, body: 13 },
    colors: {
      text: "#1e293b",
      accent: "#0f172a",
      background: "#ffffff",
      secondary: "#475569",
    },
    lineHeight: 1.55,
    layout: { columns: 1, headerStyle: "left", sectionBorder: false, skillsLayout: "list" },
    recommendedFor: ["Senior leadership", "Director roles", "Narrative impact"],
    html: `
<div class="resume template4" style="font-family: Cambria, 'Times New Roman', serif; color: #1e293b; width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 12mm; margin: 0 auto; line-height: 1.55; background: #fff;">
  <header style="margin-bottom: 20px;">
    <h1 style="font-size: 32px; margin: 0;">{{name}}</h1>
    <p style="margin: 8px 0 0 0;">{{email}} | {{phone}} | {{location}}</p>
  </header>
  <section style="margin-bottom: 12px;"><h2 style="margin-bottom: 6px;">• Professional Summary</h2><p style="margin: 0;">{{summary}}</p></section>
  <section style="margin-bottom: 12px;"><h2 style="margin-bottom: 6px;">• Leadership Experience</h2>{{experience}}</section>
  <section style="margin-bottom: 12px;"><h2 style="margin-bottom: 6px;">• Education</h2><p style="margin: 0;">{{education}}</p></section>
  <section><h2 style="margin-bottom: 6px;">• Skills</h2><p style="margin: 0;">{{skills}}</p></section>
</div>`,
  },
  template6: {
    id: "template6",
    name: "Minimal ATS",
    description: "Plain ATS-safe structure with no visual dependencies",
    category: "ats",
    fontFamily: { heading: "Arial", body: "Arial" },
    fontSize: { name: 24, title: 12, section: 15, body: 12 },
    colors: {
      text: "#000000",
      accent: "#000000",
      background: "#ffffff",
      secondary: "#222222",
    },
    lineHeight: 1.4,
    layout: { columns: 1, headerStyle: "left", sectionBorder: false, skillsLayout: "list" },
    recommendedFor: ["ATS-first applications", "Government", "High-volume applying"],
    html: `
<div class="resume template6" style="font-family: Arial, sans-serif; color: #000; width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 12mm; margin: 0 auto; line-height: 1.4; background: #fff;">
  <h1 style="margin-bottom: 6px;">{{name}}</h1>
  <p style="margin-top: 0;">{{email}} | {{phone}} | {{location}}</p>
  <h2 style="margin-bottom: 6px;">• Summary</h2><p style="margin-top: 0;">{{summary}}</p>
  <h2 style="margin-bottom: 6px;">• Experience</h2>{{experience}}
  <h2 style="margin-bottom: 6px;">• Education</h2><p style="margin-top: 0;">{{education}}</p>
  <h2 style="margin-bottom: 6px;">• Skills</h2><p style="margin-top: 0;">{{skills}}</p>
</div>`,
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeResumeData(input: Partial<ResumeTemplateData> & Record<string, unknown>): ResumeTemplateData {
  const sections = Array.isArray(input.sections)
    ? (input.sections as Array<{ section?: string; bullets?: Array<{ content?: string }>; title?: string }>)
    : [];

  const experienceSection = sections.find((s) => s.section === "experience");
  const projectsSection = sections.find((s) => s.section === "projects");
  const skillsSection = sections.find((s) => s.section === "skills");
  const educationSection = sections.find((s) => s.section === "education");

  const explicitExperience = Array.isArray(input.experience)
    ? (input.experience as ExperienceEntry[])
    : [];

  const fallbackExperience: ExperienceEntry[] = (experienceSection?.bullets ?? []).map((b) => ({
    title: (input.header as { title?: string } | undefined)?.title ?? "Research IISc Intern",
    company: "Company",
    date: "",
    bullets: [b.content ?? ""],
  }));

  const fallbackProjects: ExperienceEntry[] = (projectsSection?.bullets ?? []).map((b) => ({
    title: `Projects: ${(b.content ?? "").split(":")[0]}`,
    company: "Project",
    date: "",
    bullets: [(b.content ?? "").includes(":") ? (b.content ?? "").split(":").slice(1).join(":").trim() : (b.content ?? "")],
  }));

  const rawSkills = input.skills as unknown;
  const normalizedSkills = Array.isArray(rawSkills)
    ? rawSkills.map((s) => String(s).trim()).filter(Boolean)
    : typeof rawSkills === "string"
      ? rawSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : (skillsSection?.bullets ?? []).map((b) => b.content ?? "").filter(Boolean);

  const header = (input.header as {
    name?: string;
    location?: string;
    email?: string;
    phone?: string;
    title?: string;
  } | undefined) ?? {};

  return {
    name: input.name ?? header.name ?? "Your Name",
    location: input.location ?? header.location ?? "",
    email: input.email ?? header.email ?? "",
    phone: input.phone ?? header.phone ?? "",
    linkedin: input.linkedin ?? "",
    summary: input.summary ?? "",
    education:
      input.education ??
      (educationSection?.bullets ?? []).map((b) => b.content ?? "").filter(Boolean).join(" | "),
    skills: normalizedSkills,
    role_type: input.role_type ?? header.title ?? "general",
    experience: explicitExperience.length > 0 ? explicitExperience : [...fallbackExperience, ...fallbackProjects],
  };
}

function renderExperienceByTemplate(templateId: TemplateId, data: ResumeTemplateData): string {
  const items = data.experience.length > 0
    ? data.experience
    : [{ title: "", company: "", date: "", bullets: [] }];

  const withBulletHeading = (title: string) => (title.trim().startsWith("•") ? title : `• ${title}`);

  if (templateId === "template2") {
    return items
      .map((job) => `
<div style="margin-bottom:12px;">
  <div style="color:#2563eb;font-weight:600;">${escapeHtml(withBulletHeading(job.title))} | ${escapeHtml(job.company)}</div>
  <div style="font-size:12px;color:gray;">${escapeHtml(job.date)}</div>
  <ul style="margin:6px 0 0 18px;">${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
</div>`)
      .join("");
  }

  if (templateId === "template3") {
    return items
      .map((job) => `
<div style="margin-bottom:8px;">
  <strong>${escapeHtml(job.company)}</strong> - ${escapeHtml(withBulletHeading(job.title))}
  <span style="float:right;">${escapeHtml(job.date)}</span>
  <ul style="margin:6px 0 0 18px;">${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
</div>`)
      .join("");
  }

  if (templateId === "template4") {
    return items
      .map((job) => `
<div style="margin-bottom:16px;">
  <div style="display:flex;justify-content:space-between;gap:12px;">
    <div><strong>${escapeHtml(withBulletHeading(job.title))}</strong><div>${escapeHtml(job.company)}</div></div>
    <div>${escapeHtml(job.date)}</div>
  </div>
  <ul style="margin:6px 0 0 18px;">${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
</div>`)
      .join("");
  }

  if (templateId === "template6") {
    return items
      .map((job) => `
<div style="margin-bottom:10px;">
  <strong>${escapeHtml(withBulletHeading(job.title))} - ${escapeHtml(job.company)}</strong>
  <div>${escapeHtml(job.date)}</div>
  <ul style="margin:6px 0 0 18px;">${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
</div>`)
      .join("");
  }

  return items
    .map((job) => `
<div style="margin-bottom:10px;">
  <div style="display:flex;justify-content:space-between;gap:12px;">
    <strong>${escapeHtml(withBulletHeading(job.title))}</strong>
    <span>${escapeHtml(job.date)}</span>
  </div>
  <div>${escapeHtml(job.company)}</div>
  <ul style="margin:6px 0 0 18px;">${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
</div>`)
    .join("");
}

export function select_template(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  const data = normalizeResumeData(resume_data);

  const experienceLength = data.experience.length;
  const skillsCount = data.skills.length;
  const roleType = data.role_type.toLowerCase();
  const totalBullets = data.experience.reduce((sum, item) => sum + item.bullets.length, 0);
  const bulletDensity = experienceLength > 0 ? totalBullets / experienceLength : 0;

  if (roleType.includes("director") || roleType.includes("vp") || roleType.includes("head") || roleType.includes("chief")) {
    return "template4";
  }

  if (roleType.includes("engineer") || roleType.includes("developer") || roleType.includes("architect") || skillsCount >= 12 || bulletDensity >= 4) {
    return "template3";
  }

  if (skillsCount >= 10 && experienceLength >= 2) {
    return "template2";
  }

  if (experienceLength <= 1 || bulletDensity <= 1.5) {
    return "template6";
  }

  if (roleType.includes("product") || roleType.includes("design") || roleType.includes("marketing")) {
    return "template2";
  }

  return "template1";
}

export function suggest_template(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  return select_template(resume_data);
}

export function suggestTemplate(resume_data: Partial<ResumeTemplateData> & Record<string, unknown>): TemplateId {
  return suggest_template(resume_data);
}

export function render_template(
  template_id: TemplateId,
  resume_data: Partial<ResumeTemplateData> & Record<string, unknown>,
): string {
  const data = normalizeResumeData(resume_data);
  const template = TEMPLATE_DEFINITIONS[template_id] ?? TEMPLATE_DEFINITIONS.template1;

  const tokens: Record<string, string> = {
    name: escapeHtml(data.name),
    location: escapeHtml(data.location),
    email: escapeHtml(data.email),
    phone: escapeHtml(data.phone),
    linkedin: escapeHtml(data.linkedin),
    summary: escapeHtml(data.summary),
    education: escapeHtml(data.education),
    skills: escapeHtml(data.skills.join(", ")),
    experience: renderExperienceByTemplate(template.id, data),
  };

  return template.html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => tokens[key] ?? "");
}

export function renderTemplate(
  templateId: TemplateId,
  resumeData: Partial<ResumeTemplateData> & Record<string, unknown>,
): string {
  return render_template(templateId, resumeData);
}

export function switch_template(
  template_id: TemplateId,
  resume_data: Partial<ResumeTemplateData> & Record<string, unknown>,
): string {
  return render_template(template_id, resume_data);
}

export function getTemplateById(id: string): TemplateStyle | undefined {
  return TEMPLATE_DEFINITIONS[id as TemplateId];
}

export function getAllTemplates(): TemplateStyle[] {
  return Object.values(TEMPLATE_DEFINITIONS);
}

export const resumeTemplates: Record<TemplateId, (data: Partial<ResumeTemplateData> & Record<string, unknown>) => string> = {
  template1: (data) => render_template("template1", data),
  template2: (data) => render_template("template2", data),
  template3: (data) => render_template("template3", data),
  template4: (data) => render_template("template4", data),
  template6: (data) => render_template("template6", data),
};
