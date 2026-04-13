import type { ResumeData } from "../store/careeros.store";
import type { ResumeTemplateData } from "../config/resume.templates";

export function mapStoreResumeToTemplateData(resume: ResumeData): ResumeTemplateData {
  const getSectionBullets = (section: "experience" | "projects" | "skills" | "education") =>
    resume.sections.find((s) => s.section === section)?.bullets ?? [];

  const experienceBullets = getSectionBullets("experience");
  const projectBullets = getSectionBullets("projects");
  const skillsBullets = getSectionBullets("skills");
  const educationBullets = getSectionBullets("education");

  const experience = [
    ...experienceBullets.map((b, index) => ({
      title: index === 0 ? "Research IISc Intern" : `Experience ${index + 1}`,
      company: index === 0 ? "Indian Institute of Science (IISc), Bengaluru" : "Organization",
      date: "",
      bullets: [b.content],
    })),
    ...projectBullets.map((b) => ({
      title: `Projects: ${b.content.split(":")[0]}`,
      company: "Project",
      date: "",
      bullets: [b.content.includes(":") ? b.content.split(":").slice(1).join(":").trim() : b.content],
    })),
  ];

  return {
    name: resume.header.name,
    location: resume.header.location,
    email: resume.header.email,
    phone: resume.header.phone,
    linkedin: "LinkedIn | GitHub",
    summary: resume.summary,
    education: educationBullets.map((b) => b.content).join(" | "),
    skills: skillsBullets.map((b) => b.content),
    role_type: resume.header.title || "general",
    experience,
  };
}
