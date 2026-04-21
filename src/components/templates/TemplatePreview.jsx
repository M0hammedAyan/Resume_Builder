const FALLBACK_PREVIEW = {
  personal: {
    name: "Avery Patel",
    title: "Senior Product Designer",
    email: "avery.patel@example.com",
    phone: "+1 (555) 210-4488",
    location: "San Francisco, CA",
    links: ["linkedin.com/in/averypatel", "github.com/averypatel"],
  },
  summary:
    "Product designer with a record of simplifying complex workflows, improving conversion, and shipping polished systems across B2B and consumer products.",
  experience: [
    {
      title: "Product Designer",
      company: "Northstar Labs",
      duration: "2022 - Present",
      description: "Led a design system refresh and shipped 3 major flows used by 40k+ monthly users.",
      bullets: ["Improved task completion by 18%", "Partnered with engineering on accessible components"],
    },
    {
      title: "UX Designer",
      company: "Field Notes Studio",
      duration: "2020 - 2022",
      description: "Turned exploratory research into interface patterns for early-stage products.",
      bullets: ["Reduced onboarding drop-off by 14%", "Built reusable prototypes for user testing"],
    },
  ],
  projects: [
    {
      title: "CareerOS Resume Studio",
      company: "Product Project",
      duration: "2024",
      description: "A template-aware resume editor with structured output and guided review.",
      bullets: ["Defined a reusable resume_json contract", "Created PDF export-ready layout variants"],
    },
  ],
  education: [
    {
      institution: "University of Washington",
      degree: "B.S. Human Centered Design",
      year: "2020",
      description: "Focused on interface systems, research methods, and information architecture.",
    },
  ],
  skills: ["Figma", "Design Systems", "Research", "Prototyping", "Accessibility", "Product Thinking"],
};

const toText = (value) => String(value ?? "").trim();

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizePreviewData = (resumeJson) => {
  if (!resumeJson || typeof resumeJson !== "object") {
    return FALLBACK_PREVIEW;
  }

  const personalSource = resumeJson.personal ?? resumeJson.core_sections?.personal ?? {};
  const educationSource = resumeJson.education ?? resumeJson.core_sections?.education ?? [];
  const experienceSource = resumeJson.experience ?? resumeJson.core_sections?.experience ?? [];
  const projectsSource = resumeJson.projects ?? resumeJson.core_sections?.projects ?? [];
  const skillsSource = resumeJson.skills ?? resumeJson.core_sections?.skills ?? [];

  return {
    personal: {
      name: toText(personalSource.name ?? resumeJson.name) || FALLBACK_PREVIEW.personal.name,
      title: toText(personalSource.title ?? resumeJson.title) || FALLBACK_PREVIEW.personal.title,
      email: toText(personalSource.email ?? resumeJson.email) || FALLBACK_PREVIEW.personal.email,
      phone: toText(personalSource.phone ?? resumeJson.phone) || FALLBACK_PREVIEW.personal.phone,
      location: toText(personalSource.location ?? resumeJson.location) || FALLBACK_PREVIEW.personal.location,
      links: asList(personalSource.links ?? resumeJson.links).length > 0 ? asList(personalSource.links ?? resumeJson.links) : FALLBACK_PREVIEW.personal.links,
    },
    summary: toText(personalSource.summary ?? resumeJson.summary) || FALLBACK_PREVIEW.summary,
    experience: Array.isArray(experienceSource) && experienceSource.length > 0 ? experienceSource : FALLBACK_PREVIEW.experience,
    projects: Array.isArray(projectsSource) && projectsSource.length > 0 ? projectsSource : FALLBACK_PREVIEW.projects,
    education: Array.isArray(educationSource) && educationSource.length > 0 ? educationSource : FALLBACK_PREVIEW.education,
    skills: asList(skillsSource).length > 0 ? asList(skillsSource) : FALLBACK_PREVIEW.skills,
  };
};

const chipStyles = {
  modern: "border-slate-300 bg-white/90 text-slate-700",
  accent: "border-current/15 bg-white/10 text-inherit",
};

const sectionBorderClass = (template) => (template?.layout?.sectionBorder ? "border-t border-slate-200 pt-4" : "pt-1");

function renderSkillBlock(template, skills) {
  if (!skills.length) {
    return null;
  }

  if (template.layout?.skillsLayout === "grouped") {
    return <p className="text-sm leading-6 text-slate-700">{skills.join(" · ")}</p>;
  }

  if (template.layout?.skillsLayout === "tags") {
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${template.colors?.accent ? chipStyles.accent : chipStyles.modern}`} style={{ color: template.colors?.text ?? "#0f172a", borderColor: `${template.colors?.accent ?? "#0f172a"}22` }}>
            {skill}
          </span>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-1 text-sm leading-6 text-slate-700">
      {skills.map((skill) => (
        <li key={skill}>• {skill}</li>
      ))}
    </ul>
  );
}

function renderEntry(entry, index) {
  if (typeof entry === "string") {
    return (
      <p key={`${entry}-${index}`} className="text-sm leading-6 text-slate-700">
        {entry}
      </p>
    );
  }

  const title = toText(entry?.title ?? entry?.institution);
  const metaParts = [toText(entry?.company), toText(entry?.duration ?? entry?.year)].filter(Boolean);
  const description = toText(entry?.description ?? entry?.summary);
  const bullets = Array.isArray(entry?.bullets) ? entry.bullets.map((item) => toText(item)).filter(Boolean) : [];

  return (
    <article key={`${title || "entry"}-${index}`} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="space-y-0.5">
          {title ? <h4 className="text-sm font-semibold text-slate-900">{title}</h4> : null}
          {entry?.degree ? <p className="text-xs font-medium text-slate-600">{toText(entry.degree)}</p> : null}
        </div>
        {metaParts.length > 0 ? <p className="text-xs text-slate-500">{metaParts.join(" • ")}</p> : null}
      </div>
      {description ? <p className="text-sm leading-6 text-slate-700">{description}</p> : null}
      {bullets.length > 0 ? (
        <ul className="space-y-1 pl-4 text-sm leading-6 text-slate-700">
          {bullets.map((bullet, bulletIndex) => (
            <li key={`${bullet}-${bulletIndex}`}>• {bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function renderSection(title, items, template, kind = "default") {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-3 ${sectionBorderClass(template)} ${kind === "summary" ? "" : ""}`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">{title}</h3>
      <div className="space-y-4">{items.map((item, index) => renderEntry(item, index))}</div>
    </section>
  );
}

export function TemplatePreview({ template, resumeJson, mode = "full" }) {
  const data = normalizePreviewData(resumeJson);
  const isThumbnail = mode === "thumbnail";
  const isTwoColumn = template?.layout?.columns === 2;
  const headerAlignment = template?.layout?.headerStyle === "centered" ? "text-center" : "text-left";
  const pageBackground = template?.colors?.background ?? "#ffffff";
  const textColor = template?.colors?.text ?? "#0f172a";
  const accentColor = template?.colors?.accent ?? "#0f172a";
  const secondaryColor = template?.colors?.secondary ?? "#475569";

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/10 ${isThumbnail ? "h-full" : ""}`}
      style={{ background: pageBackground, color: textColor }}
    >
      <div
        className={`h-full ${isThumbnail ? "p-3" : "p-6 sm:p-8"}`}
        style={{
          fontFamily: template?.fontFamily?.body ?? "Inter, Arial, sans-serif",
          lineHeight: template?.lineHeight ?? 1.45,
        }}
      >
        <header className={`space-y-2 ${headerAlignment} ${template?.layout?.headerStyle === "compact" ? "pb-3" : "pb-4"}`}>
          <h2
            className={`${isThumbnail ? "text-[15px]" : "text-[26px] sm:text-[30px]"} font-semibold tracking-tight`}
            style={{ fontFamily: template?.fontFamily?.heading ?? template?.fontFamily?.body ?? "Inter, Arial, sans-serif", color: accentColor }}
          >
            {data.personal.name}
          </h2>
          {data.personal.title ? (
            <p className={`${isThumbnail ? "text-[11px]" : "text-sm"} font-medium`} style={{ color: secondaryColor }}>
              {data.personal.title}
            </p>
          ) : null}
          <p className={`${isThumbnail ? "text-[10px]" : "text-sm"} leading-6`} style={{ color: secondaryColor }}>
            {[data.personal.email, data.personal.phone, data.personal.location, ...data.personal.links].filter(Boolean).join(" | ")}
          </p>
        </header>

        <div className={isTwoColumn ? "grid gap-5 lg:grid-cols-[1.55fr_0.85fr]" : "space-y-5"}>
          <div className="space-y-5">
            {!isTwoColumn ? renderSection("Summary", data.summary ? [data.summary] : [], template, "summary") : null}
            {renderSection("Experience", data.experience, template)}
            {renderSection("Projects", data.projects, template)}
            {!isTwoColumn ? renderSection("Education", data.education, template) : null}
            {!isTwoColumn ? (
              <section className={`space-y-3 ${sectionBorderClass(template)}`}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Skills</h3>
                {renderSkillBlock(template, data.skills)}
              </section>
            ) : null}
          </div>

          {isTwoColumn ? (
            <aside className="space-y-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
              {renderSection("Summary", data.summary ? [data.summary] : [], template, "summary")}
              {renderSection("Education", data.education, template)}
              <section className={`space-y-3 ${sectionBorderClass(template)}`}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Skills</h3>
                {renderSkillBlock(template, data.skills)}
              </section>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
