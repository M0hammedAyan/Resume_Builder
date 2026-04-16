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
  user_id: string;
  title: string;
  sections: ResumeSectionData[];
  created_at: string;
  updated_at: string;
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
  user_id: string;
  user_input: string;
  resume_id: string;
  context?: string;
}

export interface ChatBotResponse {
  response: string;
  generated_bullet?: {
    section: ResumeSection;
    content: string;
  };
  follow_up_questions: string[];
  confidence: number;
}

// JD Analysis
export interface JDAnalysisRequest {
  user_id: string;
  job_description: string;
  resume_id?: string;
}

export interface JDEligibilityResult {
  eligibility_score: number; // 0-100
  matched_skills: string[];
  missing_skills: string[];
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
  raw_text: string;
}

export interface ResumeUploadResponse {
  parse_result: ResumeParseResult;
  resume_id: string;
}

export interface ResumeAnalysisRequest {
  user_id: string;
  resume_content: ResumeParseResult;
  target_job_description?: string;
}

export interface ResumeImprovementSuggestion {
  section: ResumeSection;
  currentBullet?: string;
  suggestion: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

export interface ResumeAnalysisResult {
  overall_score: number; // 0-100
  strength_areas: string[];
  improvement_areas: string[];
  suggestions: ResumeImprovementSuggestion[];
  summary: string;
}

export type ResumeActionType =
  | "add_section"
  | "remove_section"
  | "reorder_sections"
  | "update_skills"
  | "add_project"
  | "rewrite_bullet"
  | "update_summary"
  | "design_recommendation";

export interface ResumeAssistantAction {
  type: ResumeActionType;
  section?: string;
  content?: string;
  skills?: string[];
  order?: string[];
  metadata?: Record<string, unknown>;
}

export interface ResumeAssistantResponse {
  suggestions: string[];
  missing_sections: string[];
  skills_to_add: string[];
  skills_to_remove: string[];
  design_suggestions: string[];
  actions: ResumeAssistantAction[];
  model: string;
}
