// Resume sections and structure
export type ResumeSection = "experience" | "projects" | "skills" | "education" | "achievements";

export interface ResumeBullet {
  id: string;
  section: ResumeSection;
  content: string;
  score?: number;
  createdAt: string;
}

export interface ResumeSectionData {
  section: ResumeSection;
  title: string;
  bullets: ResumeBullet[];
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  sections: ResumeSectionData[];
  createdAt: string;
  updatedAt: string;
}

// Chat interaction
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  bulletAdded?: {
    section: ResumeSection;
    bullet: string;
  };
  followUpQuestions?: string[];
}

export interface ChatBotRequest {
  userId: string;
  userInput: string;
  resumeId: string;
  context?: string;
}

export interface ChatBotResponse {
  response: string;
  generatedBullet?: {
    section: ResumeSection;
    content: string;
  };
  followUpQuestions: string[];
  confidence: number;
}

// JD Analysis
export interface JDAnalysisRequest {
  userId: string;
  jobDescription: string;
  resumeId?: string;
}

export interface JDEligibilityResult {
  eligibilityScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  improvements: string[];
  summary: string;
}

// File Upload & Resume Analysis
export interface ResumeParseResult {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  experience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  rawText: string;
}

export interface ResumeUploadResponse {
  parseResult: ResumeParseResult;
  resumeId: string;
}

export interface ResumeAnalysisRequest {
  userId: string;
  resumeContent: ResumeParseResult;
  targetJobDescription?: string;
}

export interface ResumeImprovementSuggestion {
  section: ResumeSection;
  currentBullet?: string;
  suggestion: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

export interface ResumeAnalysisResult {
  overallScore: number; // 0-100
  strengthAreas: string[];
  improvementAreas: string[];
  suggestions: ResumeImprovementSuggestion[];
  summary: string;
}
