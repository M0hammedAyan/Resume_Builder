import { useEffect, useMemo, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, List, Minus, Palette, PilcrowSquare, Table, Type, Underline } from "lucide-react";
import { chatAssistResume, chatUpdateResume, createResumeRecord, exportResumeFile, getCurrentUser, getResumeById, listResumes, reparseResume, updateResume } from "../services/api.js";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const PRESET_SECTION_KEYS = new Set(["projects", "certifications", "achievements"]);

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyPersonal = () => ({
  name: "",
  email: "",
  phone: "",
  links: "",
  summary: "",
});

const createEmptyEducationItem = () => ({
  id: createId(),
  institution: "",
  degree: "",
  year: "",
});

const createEmptyExperienceItem = () => ({
  id: createId(),
  title: "",
  company: "",
  duration: "",
  link: "",
  description: "",
});

const createEmptyProjectItem = () => ({
  id: createId(),
  title: "",
  company: "",
  duration: "",
  link: "",
  description: "",
});

const createStudioState = () => ({
  sections: [
    {
      id: "personal",
      key: "personal",
      title: "Personal Info",
      type: "personal",
      description: "Contact details and summary",
      fields: createEmptyPersonal(),
      canDelete: false,
      canMove: false,
    },
    {
      id: "education",
      key: "education",
      title: "Education",
      type: "education",
      description: "Academic background",
      items: [createEmptyEducationItem()],
      canDelete: false,
      canMove: false,
    },
    {
      id: "experience",
      key: "experience",
      title: "Experience",
      type: "experience",
      description: "Roles and achievements",
      items: [createEmptyExperienceItem()],
      canDelete: false,
      canMove: false,
    },
    {
      id: "skills",
      key: "skills",
      title: "Skills",
      type: "skills",
      description: "A concise list of skills",
      content: "",
      canDelete: false,
      canMove: false,
    },
    {
      id: "projects",
      key: "projects",
      title: "Projects",
      type: "project",
      description: "Selected projects with outcomes",
      items: [createEmptyProjectItem()],
      canDelete: false,
      canMove: false,
    },
  ],
});

const normalizeText = (value) => String(value ?? "").trim();

const escapeStructuredValue = (value) => String(value ?? "").replace(/"/g, "").trim();

const asItems = (items, factory) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [factory()];
  }

  return items.map((item) => ({
    id: item?.id ?? createId(),
    ...factory(),
    ...item,
  }));
};

const mapFlatSectionToContent = (section) => {
  const title = normalizeText(section?.title ?? section?.id).toLowerCase();
  const content = normalizeText(section?.content ?? "");

  if (title.includes("summary")) {
    return { personalSummary: content };
  }

  if (title.includes("skill")) {
    return { skills: content };
  }

  if (title.includes("experience")) {
    return { experience: [{ ...createEmptyExperienceItem(), description: content }] };
  }

  if (title.includes("project")) {
    return { projects: [{ ...createEmptyProjectItem(), description: content }] };
  }

  if (title.includes("education")) {
    return { education: [{ ...createEmptyEducationItem(), institution: content }] };
  }

  return null;
};

const mapResumeToStudioState = (resume) => {
  const nextState = createStudioState();

  if (!resume || typeof resume !== "object") {
    return nextState;
  }

  const personal = resume.personal ?? resume.core_sections?.personal ?? {};
  const educationSource = resume.education ?? resume.core_sections?.education ?? [];
  const experienceSource = resume.experience ?? resume.core_sections?.experience ?? [];
  const skillsSource = resume.skills ?? resume.core_sections?.skills ?? [];
  const projectsSource = resume.projects ?? resume.core_sections?.projects ?? [];
  const optionalSections = Array.isArray(resume.optional_sections) ? resume.optional_sections : [];
  const customSections = Array.isArray(resume.custom_sections) ? resume.custom_sections : [];

  const projectsSection = optionalSections.find((section) => section?.key === "projects");
  const certificationsSection = optionalSections.find((section) => section?.key === "certifications");
  const achievementsSection = optionalSections.find((section) => section?.key === "achievements");

  nextState.sections = nextState.sections.map((section) => {
    if (section.id === "personal") {
      return {
        ...section,
        fields: {
          ...section.fields,
          name: normalizeText(personal.name ?? resume.name ?? ""),
          email: normalizeText(personal.email ?? resume.email ?? ""),
          phone: normalizeText(personal.phone ?? resume.phone ?? ""),
          links: Array.isArray(personal.links) ? personal.links.join(", ") : normalizeText(personal.links ?? resume.links ?? ""),
          summary: normalizeText(personal.summary ?? resume.summary ?? ""),
        },
      };
    }

    if (section.id === "education") {
      return {
        ...section,
        items: asItems(educationSource, createEmptyEducationItem).map((item) => ({
          ...item,
          institution: normalizeText(item.institution),
          degree: normalizeText(item.degree),
          year: normalizeText(item.year),
        })),
      };
    }

    if (section.id === "experience") {
      return {
        ...section,
        items: asItems(experienceSource, createEmptyExperienceItem).map((item) => ({
          ...item,
          title: normalizeText(item.title),
          company: normalizeText(item.company),
          duration: normalizeText(item.duration),
          link: normalizeText(item.link),
          description: normalizeText(item.description),
        })),
      };
    }

    if (section.id === "skills") {
      const skillsValue = Array.isArray(skillsSource) ? skillsSource.join(", ") : normalizeText(skillsSource ?? "");
      return {
        ...section,
        content: skillsValue,
      };
    }

    if (section.id === "projects") {
      return {
        ...section,
        items: asItems(projectsSection?.items ?? projectsSource, createEmptyProjectItem).map((item) => ({
          ...item,
          title: normalizeText(item.title),
          company: normalizeText(item.company),
          duration: normalizeText(item.duration),
          link: normalizeText(item.link),
          description: normalizeText(item.description),
        })),
      };
    }

    return section;
  });

  const appendOptionalSection = (key, sourceSection) => {
    if (!sourceSection) {
      return;
    }

    nextState.sections.push({
      id: key,
      key,
      title: sourceSection.title || key.charAt(0).toUpperCase() + key.slice(1),
      type: "custom",
      description: sourceSection.title || "Custom section",
      content: Array.isArray(sourceSection.items) ? sourceSection.items.map((item) => normalizeText(item)).filter(Boolean).join("\n") : "",
      canDelete: true,
      canMove: true,
      isCustom: true,
    });
  };

  appendOptionalSection("certifications", certificationsSection);
  appendOptionalSection("achievements", achievementsSection);

  if (Array.isArray(customSections) && customSections.length > 0) {
    customSections.forEach((section) => {
      nextState.sections.push({
        id: section.key || createId(),
        key: section.key || createId(),
        title: section.title || "Custom Section",
        type: "custom",
        description: section.title || "Custom section",
        content: Array.isArray(section.items) ? section.items.map((item) => normalizeText(item)).filter(Boolean).join("\n") : normalizeText(section.content ?? ""),
        canDelete: true,
        canMove: true,
        isCustom: true,
      });
    });
  }

  if (Array.isArray(resume.optional_sections)) {
    const otherOptionalSections = resume.optional_sections.filter((section) => !["projects", "certifications", "achievements"].includes(section?.key));
    otherOptionalSections.forEach((section) => {
      nextState.sections.push({
        id: section.key || createId(),
        key: section.key || createId(),
        title: section.title || section.key || "Custom Section",
        type: "custom",
        description: section.title || "Custom section",
        content: Array.isArray(section.items)
          ? section.items.map((item) => normalizeText(item)).filter(Boolean).join("\n")
          : normalizeText(section.content ?? ""),
        canDelete: true,
        canMove: true,
        isCustom: true,
      });
    });
  }

  if (Array.isArray(resume.sections) && resume.sections.length > 0) {
    resume.sections.forEach((section) => {
      const mapped = mapFlatSectionToContent(section);
      if (!mapped) {
        return;
      }

      if (mapped.personalSummary) {
        const personalSection = nextState.sections.find((item) => item.id === "personal");
        if (personalSection) {
          personalSection.fields.summary = mapped.personalSummary;
        }
      }

      if (mapped.skills) {
        const skillsSection = nextState.sections.find((item) => item.id === "skills");
        if (skillsSection) {
          skillsSection.content = mapped.skills;
        }
      }

      if (mapped.experience) {
        const experienceSection = nextState.sections.find((item) => item.id === "experience");
        if (experienceSection) {
          experienceSection.items = asItems(mapped.experience, createEmptyExperienceItem);
        }
      }

      if (mapped.projects) {
        const projectsSectionState = nextState.sections.find((item) => item.id === "projects");
        if (projectsSectionState) {
          projectsSectionState.items = asItems(mapped.projects, createEmptyProjectItem);
        }
      }

      if (mapped.education) {
        const educationSection = nextState.sections.find((item) => item.id === "education");
        if (educationSection) {
          educationSection.items = asItems(mapped.education, createEmptyEducationItem);
        }
      }
    });
  }

  nextState.sections = nextState.sections.map((section) => ({
    ...section,
    isEmpty:
      section.type === "personal"
        ? !Object.values(section.fields).some((value) => normalizeText(value))
        : section.type === "skills"
          ? !normalizeText(section.content)
          : Array.isArray(section.items)
            ? section.items.every((item) => Object.values(item).every((value) => !normalizeText(value)))
            : !normalizeText(section.content),
  }));

  return nextState;
};

const buildApiPayload = (studioState, resumeId) => {
  const personalSection = studioState.sections.find((section) => section.id === "personal") ?? createStudioState().sections[0];
  const educationSection = studioState.sections.find((section) => section.id === "education") ?? createStudioState().sections[1];
  const experienceSection = studioState.sections.find((section) => section.id === "experience") ?? createStudioState().sections[2];
  const skillsSection = studioState.sections.find((section) => section.id === "skills") ?? createStudioState().sections[3];
  const projectsSection = studioState.sections.find((section) => section.id === "projects") ?? createStudioState().sections[4];

  const optionalSections = studioState.sections
    .filter((section) => section.isCustom)
    .map((section) => ({
      key: section.key,
      title: section.title,
      items: normalizeText(section.content)
        ? normalizeText(section.content)
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    }))
    .filter((section) => section.items.length > 0);

  const resume_json = {
    personal: {
      name: normalizeText(personalSection.fields.name),
      email: normalizeText(personalSection.fields.email),
      phone: normalizeText(personalSection.fields.phone),
      links: normalizeText(personalSection.fields.links)
        ? normalizeText(personalSection.fields.links)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      summary: normalizeText(personalSection.fields.summary),
    },
    education: (educationSection.items ?? [])
      .filter((item) => Object.values(item).some((value) => normalizeText(value)))
      .map(({ id, ...item }) => ({ ...item })),
    experience: (experienceSection.items ?? [])
      .filter((item) => Object.values(item).some((value) => normalizeText(value)))
      .map(({ id, ...item }) => ({ ...item })),
    skills: normalizeText(skillsSection.content)
      ? normalizeText(skillsSection.content)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    projects: (projectsSection.items ?? [])
      .filter((item) => Object.values(item).some((value) => normalizeText(value)))
      .map(({ id, ...item }) => ({ ...item })),
    optional_sections: optionalSections,
  };

  return {
    resume_id: resumeId || undefined,
    title: normalizeText(personalSection.fields.name) ? `${normalizeText(personalSection.fields.name)} Resume` : "Resume",
    summary: normalizeText(personalSection.fields.summary),
    status: "draft",
    resume_json,
  };
};

const isSectionEmpty = (section) =>
  section.type === "personal"
    ? !Object.values(section.fields).some((value) => normalizeText(value))
    : section.type === "skills"
      ? !normalizeText(section.content)
      : Array.isArray(section.items)
        ? section.items.every((item) => Object.values(item).every((value) => !normalizeText(value)))
        : !normalizeText(section.content);

const studioStateToLatex = (studioState) => {
  const byId = (id) => studioState.sections.find((section) => section.id === id);
  const personal = byId("personal")?.fields ?? {};
  const skills = normalizeText(byId("skills")?.content)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const experience = (byId("experience")?.items ?? []).filter((item) => Object.values(item).some((value) => normalizeText(value)));
  const projects = (byId("projects")?.items ?? []).filter((item) => Object.values(item).some((value) => normalizeText(value)));

  return [
    "% Resume Studio LaTeX Draft",
    "\\documentclass[11pt]{article}",
    "\\begin{document}",
    `\\section*{${normalizeText(personal.name) || "Your Name"}}`,
    `${normalizeText(personal.email)} ${normalizeText(personal.phone)} ${normalizeText(personal.links)}`.trim(),
    "",
    "\\section*{Summary}",
    normalizeText(personal.summary) || "% Add your summary",
    "",
    "\\section*{Skills}",
    skills.length ? skills.join(" \\\\textbullet{} ") : "% Add skills",
    "",
    "\\section*{Experience}",
    ...experience.flatMap((item) => [
      `\\textbf{${normalizeText(item.title)}} \\hfill ${normalizeText(item.duration)}`,
      `${normalizeText(item.company)}`,
      `${normalizeText(item.description)}`,
      "",
    ]),
    "\\section*{Projects}",
    ...projects.flatMap((item) => [
      `\\textbf{${normalizeText(item.title)}} \\hfill ${normalizeText(item.duration)}`,
      `${normalizeText(item.company)} ${normalizeText(item.link)}`.trim(),
      `${normalizeText(item.description)}`,
      "",
    ]),
    "\\end{document}",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
};

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const A4_CONTENT_HEIGHT = 1000;

const splitHtmlIntoBlocks = (html) => {
  const temp = document.createElement("div");
  temp.innerHTML = html || "<p><br/></p>";

  const blocks = Array.from(temp.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = normalizeText(node.textContent);
        return text ? `<p>${text}</p>` : "";
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        return node.outerHTML;
      }
      return "";
    })
    .filter(Boolean);

  return blocks.length > 0 ? blocks : ["<p><br/></p>"];
};

const paginateHtmlToPages = (html, measureEl) => {
  const blocks = splitHtmlIntoBlocks(html);
  const pages = [];
  let currentBlocks = [];

  for (const block of blocks) {
    const candidate = [...currentBlocks, block].join("");
    measureEl.innerHTML = candidate;

    if (measureEl.scrollHeight > A4_CONTENT_HEIGHT && currentBlocks.length > 0) {
      pages.push(currentBlocks.join(""));
      currentBlocks = [block];
      measureEl.innerHTML = block;
    } else {
      currentBlocks.push(block);
    }
  }

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join(""));
  }

  return pages.length > 0 ? pages : ["<p><br/></p>"];
};

const buildDocumentHtmlFromStudio = (studioState) => {
  const byId = (id) => studioState.sections.find((section) => section.id === id);
  const personal = byId("personal")?.fields ?? {};
  const education = byId("education")?.items ?? [];
  const experience = byId("experience")?.items ?? [];
  const projects = byId("projects")?.items ?? [];
  const skills = normalizeText(byId("skills")?.content)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const custom = studioState.sections.filter((section) => section.type === "custom" && normalizeText(section.content));

  const safe = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const rows = (items, mapper) => items
    .filter((item) => Object.values(item ?? {}).some((value) => normalizeText(value)))
    .map(mapper)
    .join("");

  return `
    <h1 style="text-align:center;margin:0 0 10px;font-size:30px;line-height:1.2;">${safe(personal.name || "Your Name")}</h1>
    <p style="text-align:center;margin:0 0 18px;color:#475569;font-size:12px;">${safe([personal.email, personal.phone, personal.links].filter(Boolean).join(" | "))}</p>
    <hr />
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">Summary</h2>
    <p>${safe(personal.summary || "Add your summary here")}</p>
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">Skills</h2>
    <p>${safe(skills.join(" • "))}</p>
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">Experience</h2>
    ${rows(
      experience,
      (item) => `<p><strong>${safe(item.title)}</strong> ${safe(item.company)} ${safe(item.duration)}</p><p>${safe(item.description)}</p>`,
    )}
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">Projects</h2>
    ${rows(
      projects,
      (item) => `<p><strong>${safe(item.title)}</strong> ${safe(item.company)} ${safe(item.duration)}</p><p>${safe(item.description)}</p>`,
    )}
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">Education</h2>
    ${rows(education, (item) => `<p><strong>${safe(item.institution)}</strong> ${safe(item.degree)} ${safe(item.year)}</p>`)}
    ${custom
      .map(
        (section) =>
          `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;margin:18px 0 8px;">${safe(section.title)}</h2><p>${safe(section.content).replace(/\n/g, "<br />")}</p>`,
      )
      .join("")}
  `;
};

function ResumeStudio({ resumeJson, setResumeJson, resumeId, setResumeId }) {
  const [studioState, setStudioState] = useState(() => createStudioState());
  const [activeSectionId, setActiveSectionId] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatNotice, setChatNotice] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatPreview, setChatPreview] = useState(null);
  const [selectedNewSkills, setSelectedNewSkills] = useState([]);
  const [pendingIntent, setPendingIntent] = useState("");
  const [pendingData, setPendingData] = useState({});
  const [lastChatSnapshot, setLastChatSnapshot] = useState(null);
  const [exportingFormat, setExportingFormat] = useState("");
  const [parseWarning, setParseWarning] = useState(false);
  const [reparseLoading, setReparseLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern-minimal");
  const [latexSource, setLatexSource] = useState("");
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [docPages, setDocPages] = useState(["<p><br/></p>"]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState("Georgia");
  const [fontSize, setFontSize] = useState("3");
  const [textColor, setTextColor] = useState("#0f172a");
  const sectionRefs = useRef({});
  const hydratedRef = useRef(false);
  const lastSavedSerializedRef = useRef("");
  const saveSequenceRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const initialResumeRef = useRef({ resumeJson, resumeId });
  const pageRefs = useRef([]);
  const hiddenMeasureRef = useRef(null);
  const skipStudioToDocSyncRef = useRef(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const currentUser = await getCurrentUser();
        const currentUserId = currentUser.data.id;
        const storedResumeId = globalThis.localStorage?.getItem("activeResumeId") ?? initialResumeRef.current.resumeId ?? "";
        const storedParseWarning = globalThis.localStorage?.getItem("resumeParseWarning") === "true";

        let resumeRecord = null;

        if (storedResumeId) {
          try {
            const response = await getResumeById(storedResumeId);
            resumeRecord = response.data;
          } catch {
            resumeRecord = null;
          }
        }

        if (!resumeRecord) {
          const listResponse = await listResumes(currentUserId);
          resumeRecord = listResponse.data?.resumes?.[0] ?? null;
        }

        if (!resumeRecord) {
          const createdResponse = await createResumeRecord({
            userId: currentUserId,
            title: "Resume",
            summary: "",
            resumeJson: buildApiPayload(createStudioState(), "").resume_json,
          });
          resumeRecord = createdResponse.data;
        }

        console.log("Loaded resume:", resumeRecord?.resume_json ?? resumeRecord);

        const nextState = mapResumeToStudioState(resumeRecord?.resume_json ?? resumeRecord ?? {});
        if (!active) {
          return;
        }

        setStudioState(nextState);
        setActiveSectionId(nextState.sections[0]?.id ?? "personal");
        setSaveStatus("Saved");
        const activeResumeId = resumeRecord?.id ?? resumeId ?? "";
        if (activeResumeId) {
          setResumeId(activeResumeId);
          globalThis.localStorage?.setItem("activeResumeId", activeResumeId);
        }
        const nextTemplate = resumeRecord?.selected_template || "modern-minimal";
        setSelectedTemplate(nextTemplate);
        globalThis.localStorage?.setItem("resumeSelectedTemplate", nextTemplate);
        setResumeJson(resumeRecord?.resume_json ?? {});
        const incompleteParse = storedParseWarning || resumeRecord?.is_parsed === false || resumeRecord?.resume_json?.is_parsed === false;
        setParseWarning(Boolean(incompleteParse));
        if (!incompleteParse) {
          globalThis.localStorage?.removeItem("resumeParseWarning");
        }
        lastSavedSerializedRef.current = JSON.stringify(buildApiPayload(nextState, activeResumeId).resume_json);
      } catch {
        if (active) {
          setErrorMessage("Failed to load resume");
        }
      } finally {
        if (active) {
          setLoading(false);
          hydratedRef.current = true;
        }
      }
    };

    hydrate();

    return () => {
      active = false;
      window.clearTimeout(saveTimeoutRef.current);
    };
  }, [resumeId, setResumeJson]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-20% 0px -55% 0px",
      },
    );

    const nodes = studioState.sections
      .map((section) => sectionRefs.current[section.id])
      .filter(Boolean);

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [studioState.sections]);

  useEffect(() => {
    setLatexSource(studioStateToLatex(studioState));
  }, [studioState]);

  const repaginate = (htmlSource) => {
    const layer = hiddenMeasureRef.current;
    if (!layer) {
      return;
    }

    const nextPages = paginateHtmlToPages(htmlSource, layer);
    setDocPages(nextPages);
    setActivePageIndex((current) => Math.min(current, Math.max(nextPages.length - 1, 0)));
  };

  useEffect(() => {
    if (loading || skipStudioToDocSyncRef.current) {
      return;
    }

    const nextHtml = buildDocumentHtmlFromStudio(studioState);
    repaginate(nextHtml);
  }, [loading, studioState]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const payload = buildApiPayload(studioState, resumeId);
    const serialized = JSON.stringify(payload.resume_json);

    if (serialized === lastSavedSerializedRef.current) {
      setSaveStatus("Saved");
      return;
    }

    setSaveStatus("Saving...");
    window.clearTimeout(saveTimeoutRef.current);

    const requestId = ++saveSequenceRef.current;
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        console.log("Saving resume:", payload.resume_json);
        const response = await updateResume(payload);
        if (requestId !== saveSequenceRef.current) {
          return;
        }

        const nextId = response?.data?.id ?? response?.data?.resume_id ?? resumeId;
        if (nextId && nextId !== resumeId) {
          setResumeId(nextId);
          globalThis.localStorage?.setItem("activeResumeId", nextId);
        }

        setResumeJson(payload.resume_json);
        lastSavedSerializedRef.current = serialized;
        setSaveStatus("Saved");
        setErrorMessage("");
      } catch {
        if (requestId !== saveSequenceRef.current) {
          return;
        }

        setSaveStatus("Save failed");
        setErrorMessage("Auto-save failed. Changes remain in the editor.");
      }
    }, 500);

    return () => window.clearTimeout(saveTimeoutRef.current);
  }, [resumeId, setResumeId, setResumeJson, studioState]);

  const registerSectionRef = (sectionId) => (node) => {
    if (node) {
      sectionRefs.current[sectionId] = node;
    }
  };

  const selectSection = (sectionId) => {
    setActiveSectionId(sectionId);
    const node = sectionRefs.current[sectionId];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setSidebarOpen(false);
  };

  const updateSectionTitle = (sectionId, nextTitle) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, title: normalizeText(nextTitle) || section.title } : section)),
    }));
  };

  const renameSection = (sectionId) => {
    selectSection(sectionId);
  };

  const deleteSection = (sectionId) => {
    let nextActiveSectionId = activeSectionId;

    setStudioState((prev) => {
      const nextSections = prev.sections.filter((section) => section.id !== sectionId || section.canDelete === false);
      nextActiveSectionId = nextSections.find((section) => section.id !== sectionId)?.id ?? nextSections[0]?.id ?? "personal";

      return { sections: nextSections };
    });

    if (activeSectionId === sectionId) {
      setActiveSectionId(nextActiveSectionId);
    }
  };

  const moveSection = (sectionId, direction) => {
    setStudioState((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      if (index === -1) {
        return prev;
      }

      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.sections.length) {
        return prev;
      }

      const nextSections = [...prev.sections];
      [nextSections[index], nextSections[target]] = [nextSections[target], nextSections[index]];
      return { sections: nextSections };
    });
  };

  const updatePersonalField = (sectionId, field, value) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: {
                ...section.fields,
                [field]: value,
              },
            }
          : section,
      ),
    }));
  };

  const updateListItem = (sectionId, itemId, field, value) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          items: (section.items ?? []).map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
        };
      }),
    }));
  };

  const addListItem = (sectionId) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        if (section.type === "education") {
          return { ...section, items: [...(section.items ?? []), createEmptyEducationItem()] };
        }

        if (section.type === "experience") {
          return { ...section, items: [...(section.items ?? []), createEmptyExperienceItem()] };
        }

        if (section.type === "project") {
          return { ...section, items: [...(section.items ?? []), createEmptyProjectItem()] };
        }

        return section;
      }),
    }));
  };

  const removeListItem = (sectionId, itemId) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const items = (section.items ?? []).filter((item) => item.id !== itemId);
        return {
          ...section,
          items: items.length > 0 ? items : section.type === "education" ? [createEmptyEducationItem()] : section.type === "experience" ? [createEmptyExperienceItem()] : [createEmptyProjectItem()],
          isEmpty: items.length === 0,
        };
      }),
    }));
  };

  const updateSectionContent = (sectionId, value) => {
    setStudioState((prev) => ({
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, content: value } : section)),
    }));
  };

  const createPresetSection = (key) => {
    if (!PRESET_SECTION_KEYS.has(key)) {
      return;
    }

    const existingSection = studioState.sections.find((section) => section.key === key);
    if (existingSection) {
      selectSection(existingSection.id);
      return;
    }

    setStudioState((prev) => {
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      const newSection = {
        id: key,
        key,
        title,
        type: "custom",
        description: `${title} section`,
        content: "",
        canDelete: true,
        canMove: true,
        isCustom: true,
      };

      return { sections: [...prev.sections, newSection] };
    });

    setActiveSectionId(key);
    setSidebarOpen(false);
  };

  const createCustomSection = (title) => {
    const nextTitle = normalizeText(title);
    if (!nextTitle) {
      return;
    }

    const customId = `${nextTitle.toLowerCase().replace(/\s+/g, "-")}-${createId()}`;

    setStudioState((prev) => ({
      sections: [
        ...prev.sections,
        {
          id: customId,
          key: customId,
          title: nextTitle,
          type: "custom",
          description: "Custom section",
          content: "",
          canDelete: true,
          canMove: true,
          isCustom: true,
        },
      ],
    }));

    setActiveSectionId(customId);
    setSidebarOpen(false);
  };

  const persistNow = async () => {
    const payload = buildApiPayload(studioState, resumeId);
    setSaveStatus("Saving...");
    window.clearTimeout(saveTimeoutRef.current);
    const requestId = ++saveSequenceRef.current;

    try {
      console.log("Saving resume:", payload.resume_json);
      const response = await updateResume(payload);
      if (requestId !== saveSequenceRef.current) {
        return;
      }
      const nextId = response?.data?.id ?? response?.data?.resume_id ?? resumeId;
      if (nextId && nextId !== resumeId) {
        setResumeId(nextId);
        globalThis.localStorage?.setItem("activeResumeId", nextId);
      }

      setResumeJson(payload.resume_json);
      lastSavedSerializedRef.current = JSON.stringify(payload.resume_json);
      setSaveStatus("Saved");
      setErrorMessage("");
    } catch {
      setSaveStatus("Save failed");
      setErrorMessage("Unable to save right now. Your changes are still in the editor.");
    }
  };

  const handleReparse = async () => {
    if (!resumeId || reparseLoading) {
      return;
    }

    setReparseLoading(true);
    setErrorMessage("");

    try {
      const response = await reparseResume(resumeId);
      const data = response?.data ?? {};
      const nextResumeJson = data.parse_result ?? {};
      const nextWarning = !Boolean(data.is_parsed ?? nextResumeJson.is_parsed ?? false);

      setResumeJson(nextResumeJson);
      setParseWarning(nextWarning);
      if (nextWarning) {
        globalThis.localStorage?.setItem("resumeParseWarning", "true");
      } else {
        globalThis.localStorage?.removeItem("resumeParseWarning");
      }
      setChatNotice("AI parsing was re-run.");
    } catch {
      setErrorMessage("Failed to re-run AI parsing.");
    } finally {
      setReparseLoading(false);
    }
  };

  const submitChatUpdate = async () => {
    const message = normalizeText(chatInput);
    if (!message) {
      return;
    }

    if (!resumeId) {
      setChatError("Resume is not ready yet. Please wait and retry.");
      return;
    }

    setChatLoading(true);
    setChatError("");
    setChatNotice("");
    setChatQuestion("");

    try {
      const response = await chatAssistResume({
        message,
        resumeId,
        pendingIntent,
        pendingData,
      });

      const assist = response?.data ?? {};

      if (assist?.needs_clarification) {
        const nextQuestion = assist?.question || "Can you share more details?";
        setChatQuestion(nextQuestion);
        setChatNotice(nextQuestion);
        setPendingIntent(assist?.intent || pendingIntent || "add_project");
        if (assist?.suggested_update && typeof assist.suggested_update === "object") {
          setPendingData(assist.suggested_update);
        }
        setChatPreview(null);
        setSelectedNewSkills([]);
        setChatInput("");
        return;
      }

      if (!assist?.suggested_update || !assist?.confirmation_required) {
        setChatError("Could not generate a structured preview. Please add more detail.");
        return;
      }

      setChatPreview(assist);
      setSelectedNewSkills(Array.isArray(assist?.new_skills) ? assist.new_skills : []);
      setPendingIntent("");
      setPendingData({});
      setChatNotice("Preview ready. Confirm to apply this update.");
      setChatInput("");
    } catch (error) {
      const messageFromApi = error?.response?.data?.detail;
      setChatError(typeof messageFromApi === "string" ? messageFromApi : "AI assistant failed. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const toggleNewSkill = (skill) => {
    setSelectedNewSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill],
    );
  };

  const confirmChatPreview = async () => {
    if (!chatPreview || !resumeId) {
      return;
    }

    const suggested = chatPreview.suggested_update ?? {};
    const title = escapeStructuredValue(suggested.title);
    const description = escapeStructuredValue(suggested.description);
    const fallbackSkills = Array.isArray(suggested.skills) ? suggested.skills : [];
    const skillsToApply = selectedNewSkills.length > 0 ? selectedNewSkills : fallbackSkills;
    const tech = escapeStructuredValue(skillsToApply.join(", "));

    const structuredMessage = `ADD Project Title:"${title}" Description:"${description}" Tech:"${tech}"`;

    setChatLoading(true);
    setChatError("");
    setChatNotice("");

    try {
      const previousResume = buildApiPayload(studioState, resumeId).resume_json;
      const previousStudio = JSON.parse(JSON.stringify(studioState));

      const response = await chatUpdateResume({
        message: structuredMessage,
        resumeId,
      });

      if (response?.data?.status === "error") {
        setChatError(response?.data?.message || "Could not understand input");
        return;
      }

      const updatedResume = response?.data?.updated_resume;
      if (!updatedResume || typeof updatedResume !== "object") {
        throw new Error("AI response is missing updated resume data");
      }

      if (selectedNewSkills.length > 0) {
        const existingSkills = Array.isArray(updatedResume.skills) ? updatedResume.skills.map((item) => String(item).trim()).filter(Boolean) : [];
        const mergedSkills = Array.from(new Set([...existingSkills, ...selectedNewSkills.map((item) => String(item).trim()).filter(Boolean)]));
        updatedResume.skills = mergedSkills;

        await updateResume({
          resume_id: resumeId,
          resume_json: updatedResume,
          title: normalizeText(updatedResume?.personal?.name) ? `${normalizeText(updatedResume.personal.name)} Resume` : "Resume",
          summary: normalizeText(updatedResume?.personal?.summary ?? updatedResume?.summary),
          status: "draft",
          selected_template: selectedTemplate,
        });
      }

      const nextState = mapResumeToStudioState(updatedResume);
      setLastChatSnapshot({
        resumeJson: previousResume,
        studioState: previousStudio,
      });
      setStudioState(nextState);
      setResumeJson(updatedResume);
      lastSavedSerializedRef.current = JSON.stringify(updatedResume);
      setSaveStatus("Saved");
      setChatInput("");
      setChatPreview(null);
      setSelectedNewSkills([]);
      setPendingIntent("");
      setPendingData({});
      setChatQuestion("");
      setChatNotice(response?.data?.message || "Resume updated successfully");
    } catch (error) {
      const messageFromApi = error?.response?.data?.detail;
      setChatError(typeof messageFromApi === "string" ? messageFromApi : "AI update failed. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const undoLastChatUpdate = async () => {
    if (!lastChatSnapshot || !resumeId) {
      return;
    }

    setChatLoading(true);
    setChatError("");

    try {
      await updateResume({
        resume_id: resumeId,
        resume_json: lastChatSnapshot.resumeJson,
        title: normalizeText(lastChatSnapshot.resumeJson?.personal?.name) ? `${normalizeText(lastChatSnapshot.resumeJson.personal.name)} Resume` : "Resume",
        summary: normalizeText(lastChatSnapshot.resumeJson?.personal?.summary),
        status: "draft",
      });

      setStudioState(lastChatSnapshot.studioState);
      setResumeJson(lastChatSnapshot.resumeJson);
      lastSavedSerializedRef.current = JSON.stringify(lastChatSnapshot.resumeJson);
      setSaveStatus("Saved");
      setChatNotice("Last AI update was undone.");
      setLastChatSnapshot(null);
    } catch {
      setChatError("Undo failed. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const downloadExport = async (format) => {
    if (!resumeId || exportingFormat) {
      return;
    }

    setExportingFormat(format);
    setErrorMessage("");

    try {
      const response = await exportResumeFile({ resumeId, format, templateId: selectedTemplate });
      const blob = new Blob([response.data]);
      const url = globalThis.URL.createObjectURL(blob);

      const disposition = response?.headers?.["content-disposition"] ?? "";
      const fileMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fallbackName = `resume.${format}`;
      const fileName = fileMatch?.[1] ?? fallbackName;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      globalThis.URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Export failed. Please try again.");
    } finally {
      setExportingFormat("");
    }
  };

  const execDoc = (command, value = null) => {
    const activeNode = pageRefs.current[activePageIndex];
    if (!activeNode) {
      return;
    }
    activeNode.focus();
    document.execCommand(command, false, value);
  };

  const insertLine = () => execDoc("insertHorizontalRule");

  const insertTable = () => {
    const tableHtml = '<table class="doc-table"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br/></p>';
    execDoc("insertHTML", tableHtml);
  };

  const insertPage = () => {
    setDocPages((prev) => {
      const index = activePageIndex + 1;
      const next = [...prev];
      next.splice(index, 0, "<p><br/></p>");
      setActivePageIndex(index);
      return next;
    });
  };

  const handlePageInput = () => {
    const html = pageRefs.current
      .map((node) => node?.innerHTML ?? "")
      .join("");

    skipStudioToDocSyncRef.current = true;
    repaginate(html);
    window.setTimeout(() => {
      skipStudioToDocSyncRef.current = false;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1680px] px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
              <Type className="h-4 w-4 text-slate-500" />
              <select
                value={fontFamily}
                onChange={(event) => {
                  setFontFamily(event.target.value);
                  execDoc("fontName", event.target.value);
                }}
                className="bg-transparent text-sm outline-none"
              >
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>

            <select
              value={fontSize}
              onChange={(event) => {
                setFontSize(event.target.value);
                execDoc("fontSize", event.target.value);
              }}
              className="rounded-xl border border-slate-200 px-2 py-1 text-sm outline-none"
            >
              <option value="1">10</option>
              <option value="2">12</option>
              <option value="3">14</option>
              <option value="4">18</option>
              <option value="5">24</option>
            </select>

            <Button variant="secondary" onClick={() => execDoc("bold")}><Bold className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => execDoc("italic")}><Italic className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => execDoc("underline")}><Underline className="h-4 w-4" /></Button>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1 text-sm text-slate-600">
              <Palette className="h-4 w-4" />
              <input
                type="color"
                value={textColor}
                onChange={(event) => {
                  setTextColor(event.target.value);
                  execDoc("foreColor", event.target.value);
                }}
                className="h-6 w-8 border-0 bg-transparent p-0"
              />
            </label>

            <Button variant="secondary" onClick={() => execDoc("justifyLeft")}><AlignLeft className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => execDoc("justifyCenter")}><AlignCenter className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => execDoc("justifyRight")}><AlignRight className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => execDoc("insertUnorderedList")}><List className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={insertLine}><Minus className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={insertTable}><Table className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={insertPage}><PilcrowSquare className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={() => setShowLatexModal(true)}>LaTeX</Button>
          </div>
        </div>

        <div className="mt-4 pr-[332px]">
          <div className="doc-pages-canvas !bg-white !p-0">
            {loading ? (
              <Card className="flex items-center gap-2 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading document...
              </Card>
            ) : (
              docPages.map((html, index) => (
                <article
                  key={`page-${index}`}
                  className={`doc-page ${index === activePageIndex ? "doc-page-active" : ""}`}
                  style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
                  onMouseDown={() => setActivePageIndex(index)}
                >
                  <div className="doc-page-inner" style={{ padding: "60px 56px" }}>
                    <div
                      ref={(node) => {
                        pageRefs.current[index] = node;
                      }}
                      className="doc-editor-content"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handlePageInput}
                      onFocus={() => setActivePageIndex(index)}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="fixed right-4 top-[88px] z-20 w-[300px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <p className="mb-2 text-sm font-semibold text-slate-900">AI Panel</p>
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask AI to improve your resume"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            disabled={chatLoading || loading}
          />
          <div className="mt-2 flex gap-2">
            <Button onClick={submitChatUpdate} disabled={chatLoading || loading || !normalizeText(chatInput)}>
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
            <Button variant="secondary" onClick={handleReparse} disabled={!resumeId || reparseLoading}>
              Reparse
            </Button>
          </div>
          {chatNotice ? <p className="mt-2 text-xs text-emerald-700">{chatNotice}</p> : null}
          {chatError ? <p className="mt-2 text-xs text-rose-700">{chatError}</p> : null}
        </aside>

        <div className="doc-hidden-editor">
          <div ref={hiddenMeasureRef} className="doc-editor-content" style={{ width: `${A4_WIDTH}px`, padding: "60px 56px" }} />
        </div>

        {showLatexModal ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">LaTeX Editor</h2>
                <Button variant="secondary" onClick={() => setShowLatexModal(false)}>Close</Button>
              </div>
              <textarea
                value={latexSource}
                onChange={(event) => setLatexSource(event.target.value)}
                className="h-[420px] w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ResumeStudio;
