import type { ResumeData } from "../store/careeros.store";
import type { ResumeTemplateData } from "../config/resume.templates";

export function mapStoreResumeToTemplateData(resume: ResumeData): ResumeTemplateData {
  const experience = [
    ...resume.experience.map((content, index) => ({
      title: index === 0 ? "Research IISc Intern" : `Experience ${index + 1}`,
      company: index === 0 ? "Indian Institute of Science (IISc), Bengaluru" : "Organization",
      date: "",
      bullets: [content],
    })),
    ...resume.projects.map((content) => ({
      title: `Projects: ${content.split(":")[0]}`,
      company: "Project",
      date: "",
      bullets: [content.includes(":") ? content.split(":").slice(1).join(":").trim() : content],
    })),
  ];

  return {
    name: resume.personal.name,
    location: resume.personal.location,
    email: resume.personal.email,
    phone: resume.personal.phone,
    linkedin: "LinkedIn | GitHub",
    summary: resume.summary,
    education: resume.education.join(" | "),
    skills: resume.skills,
    role_type: resume.personal.title || "general",
    experience,
  };
}
