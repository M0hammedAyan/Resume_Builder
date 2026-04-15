export type SectionType = "list" | "text" | "bullet" | "table";

export interface SectionConfig {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  type: SectionType;
  content: unknown[];
  isCustom?: boolean;
  icon?: string;
}

export interface SectionGroup {
  label: string;
  sections: SectionConfig[];
}

export type ExperienceLevel = "fresher" | "intermediate" | "experienced" | "senior";

export interface SectionManagerState {
  sections: SectionConfig[];
  hiddenSections: SectionConfig[];
  searchQuery: string;
  experienceLevel: ExperienceLevel;
}

export const CORE_SECTIONS: Record<string, Omit<SectionConfig, "order" | "content">> = {
  header: {
    id: "header",
    label: "Header",
    enabled: true,
    type: "text",
    icon: "UserSquare2",
  },
  summary: {
    id: "summary",
    label: "Summary / Objective",
    enabled: true,
    type: "text",
    icon: "FileText",
  },
  skills: {
    id: "skills",
    label: "Skills",
    enabled: true,
    type: "list",
    icon: "Zap",
  },
  experience: {
    id: "experience",
    label: "Experience",
    enabled: true,
    type: "bullet",
    icon: "Briefcase",
  },
  education: {
    id: "education",
    label: "Education",
    enabled: true,
    type: "bullet",
    icon: "GraduationCap",
  },
};

export const SECONDARY_SECTIONS: Record<string, Omit<SectionConfig, "order" | "content">> = {
  projects: {
    id: "projects",
    label: "Projects",
    enabled: false,
    type: "bullet",
    icon: "Lightbulb",
  },
  certifications: {
    id: "certifications",
    label: "Certifications",
    enabled: false,
    type: "list",
    icon: "Award",
  },
  achievements: {
    id: "achievements",
    label: "Achievements / Awards",
    enabled: false,
    type: "bullet",
    icon: "Trophy",
  },
};

export const HIDDEN_SECTIONS: Record<string, Omit<SectionConfig, "order" | "content">> = {
  publications: {
    id: "publications",
    label: "Publications",
    enabled: false,
    type: "bullet",
    icon: "BookOpen",
  },
  research: {
    id: "research",
    label: "Research",
    enabled: false,
    type: "bullet",
    icon: "Microscope",
  },
  volunteering: {
    id: "volunteering",
    label: "Volunteer Experience",
    enabled: false,
    type: "bullet",
    icon: "Heart",
  },
  leadership: {
    id: "leadership",
    label: "Leadership",
    enabled: false,
    type: "bullet",
    icon: "Users",
  },
  extracurricular: {
    id: "extracurricular",
    label: "Extracurricular Activities",
    enabled: false,
    type: "bullet",
    icon: "Smile",
  },
  languages: {
    id: "languages",
    label: "Languages",
    enabled: false,
    type: "list",
    icon: "Globe",
  },
  interests: {
    id: "interests",
    label: "Interests",
    enabled: false,
    type: "list",
    icon: "Compass",
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    enabled: false,
    type: "text",
    icon: "Layout",
  },
  conferences: {
    id: "conferences",
    label: "Conferences / Workshops",
    enabled: false,
    type: "bullet",
    icon: "Users2",
  },
};

export const EXPERIENCE_LEVEL_PRIORITIES: Record<ExperienceLevel, string[]> = {
  fresher: ["skills", "projects", "education", "achievements", "certifications"],
  intermediate: ["experience", "skills", "projects", "education", "certifications"],
  experienced: ["experience", "skills", "projects", "achievements", "leadership"],
  senior: ["experience", "achievements", "leadership", "projects", "certifications"],
};
