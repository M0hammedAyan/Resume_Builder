import axios from "axios";
import { apiService } from "./api.ts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = globalThis.localStorage?.getItem("token") ?? globalThis.localStorage?.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      globalThis.localStorage?.removeItem("token");
      globalThis.localStorage?.removeItem("authToken");

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/auth/login", { email, password });
  return response;
};

export const registerUser = async ({ email, password, name }) => {
  const response = await api.post("/auth/register", { email, password, name });
  return response;
};

export const createResume = async (resumePayload) => {
  const currentUser = await getCurrentUser();
  const body = {
    title: resumePayload?.title ?? "Resume",
    summary: resumePayload?.summary ?? "",
    status: resumePayload?.status ?? "draft",
    resume_json: resumePayload?.resume_json ?? resumePayload ?? {},
  };

  const response = await api.post(
    "/resumes",
    body,
    {
      params: { user_id: currentUser.data.id },
    },
  );
  return response;
};

export const uploadResume = async (file, title = "Uploaded Resume") => {
  const currentUser = await getCurrentUser();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", currentUser.data.id);
  formData.append("title", title);

  const response = await api.post("/resume/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      user_id: currentUser.data.id,
    },
  });

  return response;
};

export const getResumeById = async (id) => {
  const currentUser = await getCurrentUser();
  const response = await api.get(`/resumes/${encodeURIComponent(id)}`, {
    params: { user_id: currentUser.data.id },
  });
  return response;
};

export const updateResume = async (payload) => {
  const currentUser = await getCurrentUser();
  const response = await api.patch(
    `/resumes/${encodeURIComponent(payload.resume_id)}`,
    { resume_json: payload.resume_json, title: payload.title, summary: payload.summary, status: payload.status },
    {
      params: { user_id: currentUser.data.id },
    },
  );
  return response;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response;
};

export const listResumes = async (userId) => {
  const response = await api.get("/resumes", {
    params: { user_id: userId },
  });
  return response;
};

export const createResumeRecord = async ({ userId, title, summary, resumeJson }) => {
  const response = await api.post(
    "/resumes",
    {
      title,
      summary,
      resume_json: resumeJson,
      status: "draft",
    },
    {
      params: { user_id: userId },
    },
  );
  return response;
};

export const rewriteTextWithAI = async ({ text, context }) => {
  const response = await api.post("/ai/rewrite", { text, context });
  return response;
};

// Re-export the existing app service so extensionless imports from "../services/api"
// continue to work after adding this JS module.
export { apiService };

export default api;
