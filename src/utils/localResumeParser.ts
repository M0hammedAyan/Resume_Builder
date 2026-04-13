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
    name: probableName,
    email,
    phone,
    summary: summaryLines.join(" ") || undefined,
    experience: groupBullets(experienceLines),
    projects: groupBullets(projectsLines),
    skills: groupBullets(skillsLines),
    education: groupBullets(educationLines),
    rawText,
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
    name: file.name.replace(/\.[^.]+$/, ""),
    summary: "Uploaded resume (limited local parsing for this file type).",
    experience: [],
    projects: [],
    skills: [],
    education: [],
    rawText: "",
  };
}
