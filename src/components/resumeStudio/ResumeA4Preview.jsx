import { useMemo } from "react";

const normalizeText = (value) => String(value ?? "").trim();

function splitLines(value) {
  return normalizeText(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionById(sections, id) {
  return sections.find((section) => section.id === id);
}

function itemHasData(item) {
  return Object.entries(item ?? {}).some(([key, value]) => key !== "id" && normalizeText(value));
}

function ResumeA4Preview({ sections = [] }) {
  const preview = useMemo(() => {
    const personal = sectionById(sections, "personal")?.fields ?? {};
    const education = (sectionById(sections, "education")?.items ?? []).filter(itemHasData);
    const experience = (sectionById(sections, "experience")?.items ?? []).filter(itemHasData);
    const projects = (sectionById(sections, "projects")?.items ?? []).filter(itemHasData);
    const skills = splitLines(sectionById(sections, "skills")?.content ?? "");
    const customSections = sections.filter((section) => section.type === "custom" && normalizeText(section.content));

    return {
      personal,
      education,
      experience,
      projects,
      skills,
      customSections,
    };
  }, [sections]);

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 sm:p-6">
        <div className="mx-auto max-h-[calc(100vh-16rem)] overflow-y-auto rounded-2xl bg-transparent p-2 sm:p-4">
          <article
            id="resume-preview"
            className="mx-auto min-h-[1123px] w-full max-w-[794px] rounded-md bg-white px-[54px] py-[56px] text-[13px] leading-relaxed text-slate-900 shadow-[0_22px_65px_rgba(15,23,42,0.18)]"
          >
            <header className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {normalizeText(preview.personal.name) || "Your Name"}
              </h1>
              <p className="mt-2 text-xs tracking-wide text-slate-600">
                {[preview.personal.email, preview.personal.phone, preview.personal.links]
                  .map((item) => normalizeText(item))
                  .filter(Boolean)
                  .join("  |  ") || "email@example.com | +00 000 000 0000 | portfolio link"}
              </p>
            </header>

            {normalizeText(preview.personal.summary) ? (
              <section className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Professional Summary
                </h2>
                <p className="mt-2 text-[13px] text-slate-800">{preview.personal.summary}</p>
              </section>
            ) : null}

            {preview.skills.length > 0 ? (
              <section className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Skills
                </h2>
                <p className="mt-2 text-[13px] text-slate-800">{preview.skills.join(" • ")}</p>
              </section>
            ) : null}

            {preview.experience.length > 0 ? (
              <section className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Experience
                </h2>
                <div className="mt-2 space-y-3">
                  {preview.experience.map((item) => (
                    <article key={item.id ?? `${item.title}-${item.company}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{normalizeText(item.title) || "Role"}</h3>
                          <p className="text-xs text-slate-600">{normalizeText(item.company) || "Company"}</p>
                        </div>
                        <p className="text-[11px] text-slate-500">{normalizeText(item.duration)}</p>
                      </div>
                      {normalizeText(item.description) ? <p className="mt-1.5 text-[13px] text-slate-800">{item.description}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {preview.projects.length > 0 ? (
              <section className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Projects
                </h2>
                <div className="mt-2 space-y-3">
                  {preview.projects.map((item) => (
                    <article key={item.id ?? `${item.title}-${item.company}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{normalizeText(item.title) || "Project"}</h3>
                          <p className="text-xs text-slate-600">{normalizeText(item.company)}</p>
                        </div>
                        <p className="text-[11px] text-slate-500">{normalizeText(item.duration)}</p>
                      </div>
                      {normalizeText(item.description) ? <p className="mt-1.5 text-[13px] text-slate-800">{item.description}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {preview.education.length > 0 ? (
              <section className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Education
                </h2>
                <div className="mt-2 space-y-2">
                  {preview.education.map((item) => (
                    <article key={item.id ?? `${item.institution}-${item.degree}`} className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{normalizeText(item.institution) || "Institution"}</h3>
                        <p className="text-xs text-slate-600">{normalizeText(item.degree)}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">{normalizeText(item.year)}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {preview.customSections.map((section) => (
              <section key={section.id} className="mt-5">
                <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  {section.title}
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-800">
                  {splitLines(section.content).map((line) => (
                    <li key={`${section.id}-${line}`}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}

export default ResumeA4Preview;
