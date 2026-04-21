import axios from "axios";
import type {
  InsightsDashboard,
  JobMatchResult,
  RecruiterResult,
  ResumeInsightsAnalysis,
  ResumeGenerateResponse,
  ResumeVersion,
  ResumeVersionCompare,
  SkillGapResult,
} from "../types/app";
import type {
  ChatBotRequest,
  ChatBotResponse,
  JDAnalysisRequest,
  JDEligibilityResult,
  ResumeUploadResponse,
  ResumeAnalysisRequest,
  ResumeAnalysisResult,
  ResumeAssistantResponse,
} from "../types/resume";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    globalThis.localStorage?.getItem("authToken") ??
    globalThis.localStorage?.getItem("token");

  // Normalize legacy token key used by JS auth flow.
  if (token && !globalThis.localStorage?.getItem("authToken")) {
    globalThis.localStorage?.setItem("authToken", token);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ApiEnvelope<T> = {
  status: string;
  data: T;
};

const unwrapEnvelope = <T>(value: ApiEnvelope<T> | T): T => {
  if (value && typeof value === "object" && "status" in value && "data" in value) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
};

type ResumeAnalysisWireSuggestion = {
  section: "experience" | "projects" | "skills" | "education" | "achievements";
  current_bullet?: string;
  suggestion: string;
  reason: string;
  impact: "high" | "medium" | "low";
};

type ResumeAnalysisWireResult = Omit<ResumeAnalysisResult, "suggestions"> & {
  suggestions: ResumeAnalysisWireSuggestion[];
};

export const apiService = {
  async register(payload: { email: string; password: string; name: string }) {
    const response = await api.post<ApiEnvelope<{ access_token: string; token_type: string }>>(
      "/auth/register",
      payload,
    );
    const data = unwrapEnvelope(response.data);
    globalThis.localStorage?.setItem("authToken", data.access_token);
    globalThis.localStorage?.setItem("token", data.access_token);
    return data;
  },

  async login(payload: { email: string; password: string }) {
    const response = await api.post<ApiEnvelope<{ access_token: string; token_type: string }>>(
      "/auth/login",
      payload,
    );
    const data = unwrapEnvelope(response.data);
    globalThis.localStorage?.setItem("authToken", data.access_token);
    globalThis.localStorage?.setItem("token", data.access_token);
    return data;
  },

  async testDbInsert(payload: { email: string; password: string; name?: string }) {
    const response = await api.post<ApiEnvelope<{ user_id: string; email: string }>>("/test-db", payload);
    return unwrapEnvelope(response.data);
  },

  async createEvent(payload: { user_id: string; raw_text: string }) {
    const response = await api.post("/events", payload);
    return response.data;
  },

  async generateResume(payload: { user_id: string; job_description: string; k?: number }) {
    const response = await api.post<ResumeGenerateResponse>("/resume/generate", payload);
    return response.data;
  },

  async getResumeTemplates() {
    const response = await api.get<Array<Record<string, unknown>>>('/resume/templates');
    return response.data;
  },

  async sendFeedback(payload: {
    user_id: string;
    feedback: Array<{
      event_id?: string;
      bullet_text: string;
      rating: number;
      reason?: string;
      score_breakdown?: Record<string, unknown>;
    }>;
  }) {
    const response = await api.post("/feedback", payload);
    return response.data;
  },

  async recruiterSimulate(payload: {
    resume_text: string;
    job_description: string;
    use_llm?: boolean;
  }) {
    const response = await api.post<RecruiterResult>("/recruiter/simulate", payload);
    return response.data;
  },

  async recruiterLensAnalyze(payload: {
    resume_id: string;
    job_description: string;
  }) {
    const response = await api.post<{
      score: number;
      breakdown: {
        hard_skills: number;
        preferred_skills: number;
        experience: number;
        keywords: number;
        semantic_similarity?: number;
      };
      missing_skills: string[];
      suggestions: string[];
      metadata?: Record<string, unknown>;
    }>("/recruiter-lens/analyze", {
      resume_id: payload.resume_id,
      job_description: payload.job_description,
    });

    return response.data;
  },

  async getInsights(payload: {
    resume_data: Record<string, unknown>;
    use_llm?: boolean;
  }) {
    const response = await api.post<ResumeInsightsAnalysis>("/insights/analyze", {
      resume_data: payload.resume_data,
      use_llm: payload.use_llm ?? true,
    });
    return response.data;
  },

  async getInsightsDashboard(resumeId: string) {
    const response = await api.get<InsightsDashboard>(`/insights/${encodeURIComponent(resumeId)}`);
    return response.data;
  },

  async jobMatch(payload: { user_id: string; job_description: string }) {
    const response = await api.post<JobMatchResult>("/job-match", payload);
    return response.data;
  },

  async getSkillGap(user_id: string, job_description: string) {
    const response = await api.get<SkillGapResult>("/skill-gap", {
      params: { user_id, job_description },
    });
    return response.data;
  },

  async getResumeVersions(user_id: string, limit = 10) {
    const response = await api.get<{ versions: ResumeVersion[] }>("/resume/versions", {
      params: { user_id, limit },
    });
    return response.data.versions;
  },

  async compareResumeVersions(versionAId: string, versionBId: string) {
    const response = await api.get<ResumeVersionCompare>("/resume/versions/compare", {
      params: { version_a_id: versionAId, version_b_id: versionBId },
    });
    return response.data;
  },

  getDownloadPdfUrl(user_id: string, template: string) {
    return `${api.defaults.baseURL}/resume/download/pdf?user_id=${encodeURIComponent(user_id)}&template_id=${encodeURIComponent(template)}`;
  },

  getDownloadDocxUrl(user_id: string, template: string) {
    return `${api.defaults.baseURL}/resume/download/docx?user_id=${encodeURIComponent(user_id)}&template_id=${encodeURIComponent(template)}`;
  },

  // New Resume Builder Chat APIs
  async resumeChat(payload: ChatBotRequest) {
    const response = await api.post<ChatBotResponse>("/resume/chat", payload);
    return response.data;
  },

  async analyzeJDEligibility(payload: JDAnalysisRequest) {
    const response = await api.post<JDEligibilityResult>("/resume/jd-eligibility", payload);
    return response.data;
  },

  async getJDFeedback(user_id: string, job_description: string) {
    const response = await api.post<{ feedback: string[] }>("/resume/jd-feedback", {
      user_id,
      job_description,
    });
    return response.data.feedback;
  },

  // Resume File Upload & Analysis APIs
  async uploadResumeFile(user_id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user_id);

    const response = await api.post<ResumeUploadResponse>("/resume/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async analyzeResumeAndImprove(payload: ResumeAnalysisRequest) {
    const response = await api.post<ResumeAnalysisWireResult>("/resume/analyze-improve", payload);
    return {
      ...response.data,
      suggestions: response.data.suggestions.map((item) => ({
        section: item.section,
        currentBullet: item.current_bullet,
        suggestion: item.suggestion,
        reason: item.reason,
        impact: item.impact,
      })),
    } as ResumeAnalysisResult;
  },

  async getResumeAssistantActions(payload: {
    user_prompt: string;
    resume_data: Record<string, unknown>;
    job_description?: string;
    uploaded_files_text?: string;
    files?: File[];
  }) {
    const formData = new FormData();
    formData.append("user_prompt", payload.user_prompt);
    formData.append("resume_data", JSON.stringify(payload.resume_data));
    formData.append("job_description", payload.job_description ?? "");
    formData.append("uploaded_files_text", payload.uploaded_files_text ?? "");

    for (const file of payload.files ?? []) {
      formData.append("files", file);
    }

    const response = await api.post<{
      suggestions: string[];
      missing_sections: string[];
      skills_to_add: string[];
      skills_to_remove: string[];
      design_suggestions: string[];
      actions: ResumeAssistantResponse["actions"];
      model: string;
    }>("/resume/generate-assistant-actions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data as ResumeAssistantResponse;
  },
};
