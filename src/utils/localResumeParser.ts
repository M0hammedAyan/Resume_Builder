import type { ResumeParseResult } from "../types/resume";

function extractEmail(text: string): string | undefined {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractPhone(text: string): string | undefined {
  return text.match(/(\+?\d[\d\s()-]{7,}\d)/)?.[0]?.trim();
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectSection(lines: string[], keys: string[], stopKeys: string[]): string[] {
  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const stopSet = new Set(stopKeys.map((k) => k.toLowerCase()));

  const start = lines.findIndex((l) => keySet.has(l.toLowerCase()));
  if (start < 0) return [];

  const section: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (stopSet.has(lower)) break;
    section.push(line);
  }

  return section;
}

function groupBullets(lines: string[]): string[] {
  return lines
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export function parseResumeText(rawText: string): ResumeParseResult {
  const lines = splitLines(rawText);

  const headings = [
    "professional summary",
    "summary",
    "experience",
    "internship",
    "projects",
    "skills",
    "education",
    "certifications",
    "publications",
  ];

  const summaryLines = collectSection(lines, ["professional summary", "summary"], headings);
  const experienceLines = collectSection(lines, ["experience", "internship"], headings);
  const projectsLines = collectSection(lines, ["projects"], headings);
  const skillsLines = collectSection(lines, ["skills"], headings);
  const educationLines = collectSection(lines, ["education"], headings);

  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);

  const probableName = lines.find((line) => /^[A-Z][A-Z\s.'-]{3,}$/.test(line)) || lines[0] || "Uploaded Candidate";

  return {
    personal: {
      name: probableName,
      email: email ?? "",
      phone: phone ?? "",
      links: [],
      summary: summaryLines.join(" ") || undefined,
    },
    education: groupBullets(educationLines).map((item) => ({
      institution: item,
      degree: "",
      year: "",
      description: "",
    })),
    experience: groupBullets(experienceLines).map((item) => ({
      title: item,
      company: "",
      description: item,
    })),
    projects: groupBullets(projectsLines).map((item) => ({
      title: item,
      company: "",
      description: item,
      link: "",
    })),
    skills: groupBullets(skillsLines),
    summary: summaryLines.join(" ") || undefined,
  };
}

async function readTextFile(file: File): Promise<string> {
  return await file.text();
}

async function readDocxFile(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

export async function parseResumeFileLocally(file: File): Promise<ResumeParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    const text = await readTextFile(file);
    return parseResumeText(text);
  }

  if (ext === "docx") {
    const text = await readDocxFile(file);
    return parseResumeText(text);
  }

  // For PDF/DOC without backend parser, create a minimal safe fallback.
  return {
    personal: {
      name: file.name.replace(/\.[^.]+$/, ""),
      email: "",
      phone: "",
      links: [],
      summary: "Uploaded resume (limited local parsing for this file type).",
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    summary: "Uploaded resume (limited local parsing for this file type).",
  };
}
