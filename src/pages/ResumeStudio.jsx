import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Loader2, Menu, Save } from "lucide-react";
import { chatAssistResume, chatUpdateResume, createResumeRecord, exportResumeFile, getCurrentUser, getResumeById, listResumes, reparseResume, updateResume } from "../services/api.js";
import ResumeStudioSidebar from "../components/resumeStudio/ResumeStudioSidebar.jsx";
import EditableSection from "../components/resumeStudio/EditableSection.jsx";
import AppSidebarNav from "../components/layout/AppSidebarNav";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
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

function ResumeStudio({ resumeJson, setResumeJson, resumeId, setResumeId }) {
  const navigate = useNavigate();
  const [studioState, setStudioState] = useState(() => createStudioState());
  const [activeSectionId, setActiveSectionId] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const sectionRefs = useRef({});
  const hydratedRef = useRef(false);
  const lastSavedSerializedRef = useRef("");
  const saveSequenceRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const initialResumeRef = useRef({ resumeJson, resumeId });

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

  const sectionSummaries = useMemo(
    () =>
      studioState.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        isEmpty: isSectionEmpty(section),
      })),
    [studioState.sections],
  );

  const openRecruiterLens = () => {
    navigate("/recruiter-lens");
  };

  return (
    <div className="min-h-screen app-shell-gradient">
      <AppSidebarNav />
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:pl-64">
        {parseWarning ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">We couldn't fully extract your resume.</p>
                <p className="text-sm">Please review and edit the content. You can re-run AI parsing if you want another pass.</p>
              </div>
              <Button variant="secondary" onClick={handleReparse} loading={reparseLoading} disabled={!resumeId || reparseLoading}>
                Re-run AI Parsing
              </Button>
            </div>
          </div>
        ) : null}
        <header className="mb-4 flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="w-fit">Resume Studio</Badge>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Modern Resume Editor</h1>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  saveStatus === "Saved"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : saveStatus === "Saving..."
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {saveStatus}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                Template: {selectedTemplate}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Inline editing, smooth autosave, and calm AI assistance in a distraction-free layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="mr-2 h-4 w-4" /> Sections
            </Button>
            <Button variant="secondary" onClick={() => navigate("/resume")}>Back</Button>
            <Button
              variant="secondary"
              onClick={openRecruiterLens}
              disabled={!resumeId}
            >
              Recruiter Lens
            </Button>
            <Button variant="secondary" onClick={() => navigate("/templates")}>
              Templates
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadExport("pdf")}
              disabled={!resumeId || Boolean(exportingFormat)}
            >
              {exportingFormat === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadExport("docx")}
              disabled={!resumeId || Boolean(exportingFormat)}
            >
              {exportingFormat === "docx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export DOCX
            </Button>
            <Button onClick={persistNow}>
              <Save className="mr-2 h-4 w-4" /> Save now
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ResumeStudioSidebar
            sections={sectionSummaries}
            activeSectionId={activeSectionId}
            onSelectSection={selectSection}
            onAddSection={createPresetSection}
            onCreateCustomSection={createCustomSection}
            isOpen={sidebarOpen}
            onToggleOpen={() => setSidebarOpen((current) => !current)}
            saveStatus={saveStatus}
          />

          <main className="min-w-0 space-y-4">
            <div className="xl:hidden">
              <Card className="space-y-3 p-4">
                <p className="text-sm font-semibold text-slate-900">AI Chat Update</p>
                <p className="text-sm text-slate-600">Describe changes in natural language. The assistant will update resume JSON and re-render the editor.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder='Example: I built a fraud detection system using Python and ML'
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    disabled={chatLoading || loading}
                  />
                  <Button onClick={submitChatUpdate} disabled={chatLoading || loading || !normalizeText(chatInput)}>
                    {chatLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send
                  </Button>
                </div>
                {chatQuestion ? <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{chatQuestion}</div> : null}
                {chatPreview?.suggested_update ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">Project Preview</p>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><span className="font-medium text-slate-900">Title:</span> {chatPreview.suggested_update.title || "-"}</p>
                      <p><span className="font-medium text-slate-900">Description:</span> {chatPreview.suggested_update.description || "-"}</p>
                    </div>
                    {Array.isArray(chatPreview.new_skills) && chatPreview.new_skills.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">New skills detected</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {chatPreview.new_skills.map((skill) => (
                            <label key={skill} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={selectedNewSkills.includes(skill)}
                                onChange={() => toggleNewSkill(skill)}
                              />
                              {skill}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <Button onClick={confirmChatPreview} disabled={chatLoading}>Confirm Add Project</Button>
                    </div>
                  </div>
                ) : null}
                {chatNotice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{chatNotice}</div> : null}
                {chatError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{chatError}</div> : null}
                {lastChatSnapshot ? (
                  <div className="flex justify-end">
                    <Button variant="ghost" onClick={undoLastChatUpdate} disabled={chatLoading}>
                      Undo last AI update
                    </Button>
                  </div>
                ) : null}
              </Card>
            </div>

            <div className="floating-chat-shell hidden xl:block">
              <Card className="floating-chat-panel w-[24rem] space-y-3 border-slate-200/80 bg-white/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI Chat Update</p>
                    <p className="text-xs text-slate-500">Floating assistant</p>
                  </div>
                  <Badge tone="neutral">Live</Badge>
                </div>
                <p className="text-sm text-slate-600">Describe changes in natural language. The assistant will update resume JSON and re-render the editor.</p>
                <div className="flex flex-col gap-2">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder='Example: I built a fraud detection system using Python and ML'
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    disabled={chatLoading || loading}
                  />
                  <Button onClick={submitChatUpdate} disabled={chatLoading || loading || !normalizeText(chatInput)}>
                    {chatLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send update
                  </Button>
                </div>
                {chatQuestion ? <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{chatQuestion}</div> : null}
                {chatPreview?.suggested_update ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">Project Preview</p>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><span className="font-medium text-slate-900">Title:</span> {chatPreview.suggested_update.title || "-"}</p>
                      <p><span className="font-medium text-slate-900">Description:</span> {chatPreview.suggested_update.description || "-"}</p>
                    </div>
                    {Array.isArray(chatPreview.new_skills) && chatPreview.new_skills.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">New skills detected</p>
                        <div className="grid gap-2">
                          {chatPreview.new_skills.map((skill) => (
                            <label key={skill} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={selectedNewSkills.includes(skill)}
                                onChange={() => toggleNewSkill(skill)}
                              />
                              {skill}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <Button onClick={confirmChatPreview} disabled={chatLoading}>Confirm Add Project</Button>
                    </div>
                  </div>
                ) : null}
                {chatNotice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{chatNotice}</div> : null}
                {chatError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{chatError}</div> : null}
                {lastChatSnapshot ? (
                  <div className="flex justify-end">
                    <Button variant="ghost" onClick={undoLastChatUpdate} disabled={chatLoading}>
                      Undo last AI update
                    </Button>
                  </div>
                ) : null}
              </Card>
            </div>

            {loading ? (
              <Card className="flex items-center justify-center gap-3 p-6 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                Loading resume editor...
              </Card>
            ) : (
              studioState.sections.map((section) => (
                <EditableSection
                  key={section.id}
                  ref={registerSectionRef(section.id)}
                  section={{
                    ...section,
                    isEmpty:
                      section.type === "personal"
                        ? !Object.values(section.fields).some((value) => normalizeText(value))
                        : section.type === "skills"
                          ? !normalizeText(section.content)
                          : Array.isArray(section.items)
                            ? section.items.every((item) => Object.values(item).every((value) => !normalizeText(value)))
                            : !normalizeText(section.content),
                  }}
                  isActive={activeSectionId === section.id}
                  onSelect={() => selectSection(section.id)}
                  onRenameSection={renameSection}
                  onDeleteSection={deleteSection}
                  onMoveSection={moveSection}
                  onUpdatePersonalField={updatePersonalField}
                  onUpdateListItem={updateListItem}
                  onAddListItem={addListItem}
                  onRemoveListItem={removeListItem}
                  onUpdateSectionContent={updateSectionContent}
                  onUpdateSectionTitle={updateSectionTitle}
                />
              ))
            )}

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </main>

        </div>
      </div>
    </div>
  );
}

export default ResumeStudio;
