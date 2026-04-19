import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { createResume } from "../services/api.js";
import AIRewriteAssist from "../components/AIRewriteAssist";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SectionBlock } from "../components/ui/SectionBlock";

const CORE_SECTION_KEYS = ["personal", "education", "experience", "skills"];
const OPTIONAL_SECTION_KEYS = ["projects", "certifications", "achievements"];

const makeInitialState = () => ({
  core_sections: {
    personal: {
      name: "",
      email: "",
      phone: "",
      links: "",
      summary: "",
    },
    education: [{ institution: "", degree: "", year: "" }],
    experience: [{ company: "", role: "", duration: "", summary: "" }],
    skills: [""],
  },
  optional_sections: [
    { key: "projects", title: "Projects", items: [{ title: "", description: "", link: "" }] },
    { key: "certifications", title: "Certifications", items: [] },
    { key: "achievements", title: "Achievements", items: [] },
  ],
  custom_sections: [],
});

const emptyEducation = { institution: "", degree: "", year: "" };
const emptyExperience = { company: "", role: "", duration: "", summary: "" };
const emptyProject = { title: "", description: "", link: "" };

const toSectionId = (group, key) => `${group}:${key}`;

const parseSectionId = (sectionId) => {
  const [group, ...rest] = sectionId.split(":");
  return { group, key: rest.join(":") };
};

const normalizeForKey = (value) => value.trim().toLowerCase().replace(/\s+/g, "_");

function ResumeBuilder({ setResumeJson, setResumeId }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(toSectionId("core", "personal"));
  const [form, setForm] = useState(() => {
    const saved = globalThis.localStorage?.getItem("resume_builder_draft");
    if (!saved) return makeInitialState();

    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && parsed.core_sections) {
        return parsed;
      }
      return makeInitialState();
    } catch {
      return makeInitialState();
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [addSectionInput, setAddSectionInput] = useState("");

  const isBasicValid = useMemo(() => {
    const personal = form.core_sections?.personal ?? {};
    return String(personal.name ?? "").trim().length > 0 && String(personal.email ?? "").trim().length > 0;
  }, [form.core_sections?.personal]);

  const optionalSectionMap = useMemo(() => {
    const map = {};
    for (const section of form.optional_sections ?? []) {
      if (!section?.key) continue;
      map[section.key] = section;
    }
    return map;
  }, [form.optional_sections]);

  const sectionList = useMemo(() => {
    const core = CORE_SECTION_KEYS.map((key) => ({
      id: toSectionId("core", key),
      title: key.charAt(0).toUpperCase() + key.slice(1),
      type: "core",
      key,
    }));

    const optional = OPTIONAL_SECTION_KEYS.map((key) => {
      const existing = optionalSectionMap[key];
      return {
        id: toSectionId("optional", key),
        title: existing?.title ?? key.charAt(0).toUpperCase() + key.slice(1),
        type: "optional",
        key,
        missing: !existing,
      };
    });

    const custom = (form.custom_sections ?? []).map((section) => ({
      id: toSectionId("custom", section.key),
      title: section.title,
      type: "custom",
      key: section.key,
      missing: false,
    }));

    return [...core, ...optional, ...custom];
  }, [form.custom_sections, optionalSectionMap]);

  const searchMatches = useMemo(() => {
    const query = addSectionInput.trim().toLowerCase();
    if (!query) return [];
    return sectionList.filter((item) => item.title.toLowerCase().includes(query));
  }, [addSectionInput, sectionList]);

  const activeSectionMeta = useMemo(() => {
    const parsed = parseSectionId(activeSection);
    if (parsed.group === "core") {
      return {
        type: "core",
        key: parsed.key,
        value: form.core_sections?.[parsed.key],
      };
    }

    if (parsed.group === "optional") {
      return {
        type: "optional",
        key: parsed.key,
        value: optionalSectionMap[parsed.key],
      };
    }

    if (parsed.group === "custom") {
      return {
        type: "custom",
        key: parsed.key,
        value: (form.custom_sections ?? []).find((section) => section.key === parsed.key),
      };
    }

    return { type: "unknown", key: "", value: null };
  }, [activeSection, form.core_sections, form.custom_sections, optionalSectionMap]);

  const updatePersonal = (field, value) => {
    setForm((prev) => ({
      ...prev,
      core_sections: {
        ...prev.core_sections,
        personal: {
          ...prev.core_sections.personal,
          [field]: value,
        },
      },
    }));
  };

  const ensureOptionalSection = (sectionKey) => {
    setForm((prev) => {
      const existing = (prev.optional_sections ?? []).find((section) => section.key === sectionKey);
      if (existing) return prev;

      const title = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/_/g, " ");
      const defaultItems = sectionKey === "projects" ? [{ ...emptyProject }] : [];
      return {
        ...prev,
        optional_sections: [...(prev.optional_sections ?? []), { key: sectionKey, title, items: defaultItems }],
      };
    });
  };

  const updateCoreListItem = (section, index, field, value) => {
    setForm((prev) => {
      const next = [...(prev.core_sections?.[section] ?? [])];
      if (typeof next[index] === "string") {
        next[index] = value;
      } else {
        next[index] = { ...next[index], [field]: value };
      }

      return {
        ...prev,
        core_sections: {
          ...prev.core_sections,
          [section]: next,
        },
      };
    });
  };

  const updateOptionalListItem = (sectionKey, index, field, value) => {
    ensureOptionalSection(sectionKey);
    setForm((prev) => {
      const nextOptional = (prev.optional_sections ?? []).map((section) => {
        if (section.key !== sectionKey) return section;
        const nextItems = [...(section.items ?? [])];
        if (typeof nextItems[index] === "string") {
          nextItems[index] = value;
        } else {
          nextItems[index] = { ...nextItems[index], [field]: value };
        }
        return { ...section, items: nextItems };
      });

      return { ...prev, optional_sections: nextOptional };
    });
  };

  const updateCustomListItem = (sectionKey, index, value) => {
    setForm((prev) => {
      const nextCustom = (prev.custom_sections ?? []).map((section) => {
        if (section.key !== sectionKey) return section;
        const nextItems = [...(section.items ?? [])];
        nextItems[index] = value;
        return { ...section, items: nextItems };
      });
      return { ...prev, custom_sections: nextCustom };
    });
  };

  const addItem = (group, sectionKey) => {
    if (group === "core") {
      setForm((prev) => {
        if (sectionKey === "education") {
          return {
            ...prev,
            core_sections: {
              ...prev.core_sections,
              education: [...(prev.core_sections.education ?? []), { ...emptyEducation }],
            },
          };
        }

        if (sectionKey === "experience") {
          return {
            ...prev,
            core_sections: {
              ...prev.core_sections,
              experience: [...(prev.core_sections.experience ?? []), { ...emptyExperience }],
            },
          };
        }

        if (sectionKey === "skills") {
          return {
            ...prev,
            core_sections: {
              ...prev.core_sections,
              skills: [...(prev.core_sections.skills ?? []), ""],
            },
          };
        }

        return prev;
      });
      return;
    }

    if (group === "optional") {
      ensureOptionalSection(sectionKey);
      setForm((prev) => {
        const nextOptional = (prev.optional_sections ?? []).map((section) => {
          if (section.key !== sectionKey) return section;

          if (sectionKey === "projects") {
            return { ...section, items: [...(section.items ?? []), { ...emptyProject }] };
          }

          return { ...section, items: [...(section.items ?? []), ""] };
        });
        return { ...prev, optional_sections: nextOptional };
      });
      return;
    }

    if (group === "custom") {
      setForm((prev) => {
        const nextCustom = (prev.custom_sections ?? []).map((section) => {
          if (section.key !== sectionKey) return section;
          return { ...section, items: [...(section.items ?? []), ""] };
        });
        return { ...prev, custom_sections: nextCustom };
      });
    }
  };

  const removeItem = (group, sectionKey, index) => {
    if (group === "core") {
      setForm((prev) => {
        const current = prev.core_sections?.[sectionKey] ?? [];
        if (current.length <= 1) return prev;
        return {
          ...prev,
          core_sections: {
            ...prev.core_sections,
            [sectionKey]: current.filter((_, i) => i !== index),
          },
        };
      });
      return;
    }

    if (group === "optional") {
      setForm((prev) => {
        const nextOptional = (prev.optional_sections ?? []).map((section) => {
          if (section.key !== sectionKey) return section;
          const current = section.items ?? [];
          if (current.length <= 1) return section;
          return { ...section, items: current.filter((_, i) => i !== index) };
        });
        return { ...prev, optional_sections: nextOptional };
      });
      return;
    }

    if (group === "custom") {
      setForm((prev) => {
        const nextCustom = (prev.custom_sections ?? []).map((section) => {
          if (section.key !== sectionKey) return section;
          const current = section.items ?? [];
          if (current.length <= 1) return section;
          return { ...section, items: current.filter((_, i) => i !== index) };
        });
        return { ...prev, custom_sections: nextCustom };
      });
    }
  };

  const addOrFindSection = () => {
    const raw = addSectionInput.trim();
    if (!raw) return;

    const normalized = normalizeForKey(raw);
    const existing = sectionList.find((section) => normalizeForKey(section.title) === normalized || section.key === normalized);
    if (existing) {
      if (existing.type === "optional" && existing.missing) {
        ensureOptionalSection(existing.key);
      }
      setActiveSection(existing.id);
      setAddSectionInput("");
      return;
    }

    if (OPTIONAL_SECTION_KEYS.includes(normalized)) {
      ensureOptionalSection(normalized);
      setActiveSection(toSectionId("optional", normalized));
      setAddSectionInput("");
      return;
    }

    const customKey = `${normalized}_${Date.now()}`;
    const customSection = {
      key: customKey,
      title: raw,
      items: [],
    };

    setForm((prev) => ({
      ...prev,
      custom_sections: [...(prev.custom_sections ?? []), customSection],
    }));
    setActiveSection(toSectionId("custom", customKey));
    setAddSectionInput("");
  };

  const saveDraft = () => {
    globalThis.localStorage?.setItem("resume_builder_draft", JSON.stringify(form));
    setSuccessMessage("Progress saved locally");
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isBasicValid) {
      setErrorMessage("Name and email are required before submission");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        core_sections: {
          ...form.core_sections,
          personal: {
            ...form.core_sections.personal,
            links: String(form.core_sections.personal.links ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          },
          education: (form.core_sections.education ?? []).filter((item) =>
            Object.values(item).some((value) => String(value).trim()),
          ),
          experience: (form.core_sections.experience ?? []).filter((item) =>
            Object.values(item).some((value) => String(value).trim()),
          ),
          skills: (form.core_sections.skills ?? []).filter((item) => String(item).trim()),
        },
        optional_sections: (form.optional_sections ?? []).map((section) => ({
          ...section,
          items: (section.items ?? []).filter((item) => {
            if (typeof item === "string") return item.trim().length > 0;
            if (item && typeof item === "object") {
              return Object.values(item).some((value) => String(value).trim());
            }
            return false;
          }),
        })),
        custom_sections: (form.custom_sections ?? []).map((section) => ({
          title: section.title,
          items: (section.items ?? []).filter((item) => String(item).trim().length > 0),
        })),
      };

      const optionalProjects = payload.optional_sections.find((section) => section.key === "projects")?.items ?? [];
      const optionalCertifications = payload.optional_sections.find((section) => section.key === "certifications")?.items ?? [];
      const optionalAchievements = payload.optional_sections.find((section) => section.key === "achievements")?.items ?? [];

      const apiPayload = {
        ...payload,
        personal: payload.core_sections.personal,
        summary: payload.core_sections.personal.summary,
        education: payload.core_sections.education,
        experience: payload.core_sections.experience,
        skills: payload.core_sections.skills,
        projects: optionalProjects,
        certifications: optionalCertifications,
        achievements: optionalAchievements,
      };

      const hasContent =
        apiPayload.education.length ||
        apiPayload.experience.length ||
        apiPayload.skills.length ||
        apiPayload.projects.length ||
        apiPayload.certifications.length ||
        apiPayload.achievements.length ||
        payload.custom_sections.some((section) => section.items.length > 0);

      if (!hasContent) {
        setErrorMessage("Please add at least one resume detail before submitting");
        return;
      }

      const response = await createResume(apiPayload);
      const data = response.data;

      setResumeJson(data.resume ?? payload);
      setResumeId(data.id ?? data.resume_id ?? "");
      globalThis.localStorage?.removeItem("resume_builder_draft");
      setSuccessMessage("Resume created successfully");

      window.setTimeout(() => navigate("/resume/studio"), 700);
    } catch (error) {
      const backendMessage = error?.response?.data?.detail;
      setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Failed to create resume");
    } finally {
      setLoading(false);
    }
  };

  const renderMissingSectionState = () => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      This section is not configured yet. Use Add Section to create it.
    </div>
  );

  const renderCorePersonal = () => {
    const personal = form.core_sections?.personal ?? {};
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Full name"
          value={personal.name ?? ""}
          onChange={(event) => updatePersonal("name", event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Email"
          type="email"
          value={personal.email ?? ""}
          onChange={(event) => updatePersonal("email", event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Phone"
          value={personal.phone ?? ""}
          onChange={(event) => updatePersonal("phone", event.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Links (comma separated)"
          value={personal.links ?? ""}
          onChange={(event) => updatePersonal("links", event.target.value)}
        />
        <div className="sm:col-span-2">
          <textarea
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Professional summary"
            rows={4}
            value={personal.summary ?? ""}
            onChange={(event) => updatePersonal("summary", event.target.value)}
          />
          <AIRewriteAssist text={personal.summary ?? ""} context="summary" onAccept={(improved) => updatePersonal("summary", improved)} />
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    const education = form.core_sections?.education ?? [];
    return (
      <div className="space-y-3">
        {education.map((item, index) => (
          <div key={`education-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-4">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Institution" value={item.institution ?? ""} onChange={(event) => updateCoreListItem("education", index, "institution", event.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Degree" value={item.degree ?? ""} onChange={(event) => updateCoreListItem("education", index, "degree", event.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Year" value={item.year ?? ""} onChange={(event) => updateCoreListItem("education", index, "year", event.target.value)} />
            <button type="button" onClick={() => removeItem("core", "education", index)} className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-3 py-2 text-rose-600">
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addItem("core", "education")} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <Plus className="mr-1 h-4 w-4" /> Add education
        </button>
      </div>
    );
  };

  const renderExperience = () => {
    const experience = form.core_sections?.experience ?? [];
    return (
      <div className="space-y-3">
        {experience.map((item, index) => (
          <div key={`experience-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Company" value={item.company ?? ""} onChange={(event) => updateCoreListItem("experience", index, "company", event.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Role" value={item.role ?? ""} onChange={(event) => updateCoreListItem("experience", index, "role", event.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Duration" value={item.duration ?? ""} onChange={(event) => updateCoreListItem("experience", index, "duration", event.target.value)} />
            <div className="sm:col-span-2">
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Summary"
                rows={3}
                value={item.summary ?? ""}
                onChange={(event) => updateCoreListItem("experience", index, "summary", event.target.value)}
              />
              <AIRewriteAssist
                text={item.summary ?? ""}
                context="experience"
                onAccept={(improved) => updateCoreListItem("experience", index, "summary", improved)}
              />
            </div>
            <button type="button" onClick={() => removeItem("core", "experience", index)} className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-3 py-2 text-rose-600 sm:col-span-2">
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addItem("core", "experience")} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <Plus className="mr-1 h-4 w-4" /> Add experience
        </button>
      </div>
    );
  };

  const renderSkills = () => {
    const skills = form.core_sections?.skills ?? [];
    return (
      <div className="space-y-3">
        {skills.map((item, index) => (
          <div key={`skill-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Skill" value={item ?? ""} onChange={(event) => updateCoreListItem("skills", index, null, event.target.value)} />
            <button type="button" onClick={() => removeItem("core", "skills", index)} className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-3 py-2 text-rose-600">
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addItem("core", "skills")} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <Plus className="mr-1 h-4 w-4" /> Add skill
        </button>
      </div>
    );
  };

  const renderOptionalOrCustom = () => {
    const { type, key, value } = activeSectionMeta;
    if (!value) return renderMissingSectionState();

    const items = value.items ?? [];

    if (key === "projects") {
      return (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No project entries yet.</div>
          ) : null}
          {items.map((item, index) => (
            <div key={`${key}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Title" value={item.title ?? ""} onChange={(event) => updateOptionalListItem(key, index, "title", event.target.value)} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Link" value={item.link ?? ""} onChange={(event) => updateOptionalListItem(key, index, "link", event.target.value)} />
              <div className="sm:col-span-2">
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Description"
                  rows={3}
                  value={item.description ?? ""}
                  onChange={(event) => updateOptionalListItem(key, index, "description", event.target.value)}
                />
                <AIRewriteAssist
                  text={item.description ?? ""}
                  context="project"
                  onAccept={(improved) => updateOptionalListItem(key, index, "description", improved)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(type, key, index)}
                className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-3 py-2 text-rose-600 sm:col-span-2"
              >
                <Trash2 className="mr-1 h-4 w-4" /> Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem(type, key)} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <Plus className="mr-1 h-4 w-4" /> Add project
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No items yet. Add the first item below.</div>
        ) : null}
        {items.map((item, index) => (
          <div key={`${key}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]">
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              placeholder={`Add ${value.title} item`}
              value={String(item ?? "")}
              onChange={(event) => {
                if (type === "custom") {
                  updateCustomListItem(key, index, event.target.value);
                } else {
                  updateOptionalListItem(key, index, null, event.target.value);
                }
              }}
            />
            <button type="button" onClick={() => removeItem(type, key, index)} className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-3 py-2 text-rose-600">
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addItem(type, key)} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <Plus className="mr-1 h-4 w-4" /> Add item
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-2 w-fit">Resume builder</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Build a structured resume from scratch</h1>
            <p className="mt-1 text-sm text-slate-600">Use the section navigator on the left, edit content on the right, and keep progress saved locally.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveDraft}>Save progress</Button>
            <Button variant="ghost" onClick={() => navigate("/resume")}>Back</Button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Add Section</p>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={addSectionInput}
                onChange={(event) => setAddSectionInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addOrFindSection();
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Search existing sections or create new"
              />
            </div>
            <Button type="button" onClick={addOrFindSection}>Add Section</Button>
          </div>
          {searchMatches.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {searchMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.type === "optional" && item.missing) ensureOptionalSection(item.key);
                    setActiveSection(item.id);
                    setAddSectionInput("");
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  {item.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {sectionList.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                if (section.type === "optional" && section.missing) ensureOptionalSection(section.key);
                setActiveSection(section.id);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeSection === section.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SectionBlock title="Sections" description="Core sections are always available. Optional and custom sections are added dynamically.">
              <div className="space-y-2">
                {sectionList.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      if (section.type === "optional" && section.missing) ensureOptionalSection(section.key);
                      setActiveSection(section.id);
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      activeSection === section.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{section.title}</span>
                      {section.missing ? <span className="text-[11px] uppercase tracking-wide opacity-70">missing</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            </SectionBlock>
          </aside>

          <div className="space-y-4">
            <Card className="p-5">
              {activeSectionMeta.type === "core" && activeSectionMeta.key === "personal" ? renderCorePersonal() : null}
              {activeSectionMeta.type === "core" && activeSectionMeta.key === "education" ? renderEducation() : null}
              {activeSectionMeta.type === "core" && activeSectionMeta.key === "experience" ? renderExperience() : null}
              {activeSectionMeta.type === "core" && activeSectionMeta.key === "skills" ? renderSkills() : null}
              {activeSectionMeta.type === "optional" || activeSectionMeta.type === "custom" ? renderOptionalOrCustom() : null}
              {activeSectionMeta.type === "unknown" ? renderMissingSectionState() : null}
            </Card>

            {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
            {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/60 backdrop-blur">
              <Button type="submit" disabled={loading || !isBasicValid} loading={loading} className="w-full">
                Create Resume
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResumeBuilder;
