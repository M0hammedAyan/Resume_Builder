import axios from "axios";
import type {
  CareerInsights,
  JobMatchResult,
  RecruiterResult,
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
} from "../types/resume";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  timeout: 30000,
});

export const apiService = {
  async createEvent(payload: { user_id: string; raw_text: string }) {
    const response = await api.post("/events", payload);
    return response.data;
  },

  async generateResume(payload: { user_id: string; job_description: string; k?: number }) {
    const response = await api.post<ResumeGenerateResponse>("/resume/generate", payload);
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

  async getInsights(userId: string, useLlm = false) {
    const response = await api.get<CareerInsights>("/insights", {
      params: { user_id: userId, use_llm: useLlm },
    });
    return response.data;
  },

  async jobMatch(payload: { user_id: string; job_description: string }) {
    const response = await api.post<JobMatchResult>("/job-match", payload);
    return response.data;
  },

  async getSkillGap(userId: string, jobDescription: string) {
    const response = await api.get<SkillGapResult>("/skill-gap", {
      params: { user_id: userId, job_description: jobDescription },
    });
    return response.data;
  },

  async getResumeVersions(userId: string, limit = 10) {
    const response = await api.get<{ versions: ResumeVersion[] }>("/resume/versions", {
      params: { user_id: userId, limit },
    });
    return response.data.versions;
  },

  async compareResumeVersions(versionAId: string, versionBId: string) {
    const response = await api.get<ResumeVersionCompare>("/resume/versions/compare", {
      params: { version_a_id: versionAId, version_b_id: versionBId },
    });
    return response.data;
  },

  getDownloadPdfUrl(userId: string, template: string) {
    return `${api.defaults.baseURL}/resume/download/pdf?user_id=${encodeURIComponent(userId)}&template=${encodeURIComponent(template)}`;
  },

  getDownloadDocxUrl(userId: string, template: string) {
    return `${api.defaults.baseURL}/resume/download/docx?user_id=${encodeURIComponent(userId)}&template=${encodeURIComponent(template)}`;
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

  async getJDFeedback(userId: string, jobDescription: string) {
    const response = await api.post<{ feedback: string[] }>("/resume/jd-feedback", {
      user_id: userId,
      job_description: jobDescription,
    });
    return response.data.feedback;
  },

  // Resume File Upload & Analysis APIs
  async uploadResumeFile(userId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    const response = await api.post<ResumeUploadResponse>("/resume/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async analyzeResumeAndImprove(payload: ResumeAnalysisRequest) {
    const response = await api.post<ResumeAnalysisResult>("/resume/analyze-improve", payload);
    return response.data;
  },
};
