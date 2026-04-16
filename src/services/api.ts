import axios from "axios";
import type {
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

  async recruiterLensAnalyze(payload: {
    resume_data: Record<string, unknown>;
    job_description: string;
  }) {
    const stringifyList = (value: unknown): string[] => {
      if (!Array.isArray(value)) return [];
      return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
    };

    const personal =
      payload.resume_data.personal && typeof payload.resume_data.personal === "object"
        ? (payload.resume_data.personal as Record<string, unknown>)
        : {};

    const resumeText = [
      String(personal.name ?? ""),
      String(payload.resume_data.summary ?? ""),
      ...stringifyList(payload.resume_data.experience),
      ...stringifyList(payload.resume_data.projects),
      ...stringifyList(payload.resume_data.skills),
      ...stringifyList(payload.resume_data.education),
      ...stringifyList(payload.resume_data.achievements),
    ]
      .filter((line) => line.trim().length > 0)
      .join("\n");

    const formData = new FormData();
    const file = new File([resumeText], "resume.txt", { type: "text/plain" });
    formData.append("file", file);
    formData.append("job_description", payload.job_description);

    const response = await api.post<{
      score: number;
      missing_skills: string[];
      suggestions: string[];
      match_details?: {
        required_pairs?: Array<{ jd_skill: string; resume_skill: string; similarity: number }>;
      };
    }>("/recruiter/lens-analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
    return `${api.defaults.baseURL}/resume/download/pdf?user_id=${encodeURIComponent(user_id)}&template=${encodeURIComponent(template)}`;
  },

  getDownloadDocxUrl(user_id: string, template: string) {
    return `${api.defaults.baseURL}/resume/download/docx?user_id=${encodeURIComponent(user_id)}&template=${encodeURIComponent(template)}`;
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
    const response = await api.post<ResumeAnalysisResult>("/resume/analyze-improve", payload);
    return response.data;
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
