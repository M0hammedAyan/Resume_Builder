import { create } from 'zustand';
import type { ChatMessage, ResumeAssistantAction } from '../types/resume';

export interface ResumeData {
  id: string;
  personal: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
  achievements: string[];
}

export interface JobMatchAnalysis {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  weak_areas: string[];
  suggestions: string[];
}

export interface CareerOSStore {
  user_id: string;

  // Chat state
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Resume state
  resume: ResumeData | null;
  set_resume: (resume: ResumeData) => void;
  update_resume: (patch: Partial<ResumeData>) => void;
  apply_actions: (actions: ResumeAssistantAction[]) => void;

  // Template state
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templateSettings: {
    font: string;
    fontSize: number;
    color: string;
    spacing: number;
    lineHeight: number;
  };
  updateTemplateSettings: (settings: Partial<CareerOSStore['templateSettings']>) => void;

  // Job description & analysis
  jobDescription: string;
  setJobDescription: (description: string) => void;
  jobMatchAnalysis: JobMatchAnalysis | null;
  setJobMatchAnalysis: (analysis: JobMatchAnalysis) => void;

  // UI state
  currentPage: 'chat' | 'resume' | 'recruiter' | 'templates' | 'insights';
  setCurrentPage: (page: CareerOSStore['currentPage']) => void;
}

const initialResumeState: ResumeData = {
  id: 'resume-1',
  personal: {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
  },
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
  achievements: [],
};

function get_or_create_user_id(): string {
  const key = 'careeros_user_id';
  const existing = globalThis.localStorage?.getItem(key);
  if (existing) {
    return existing;
  }

  const generated = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  globalThis.localStorage?.setItem(key, generated);
  return generated;
}

export const useCareerOSStore = create<CareerOSStore>((set) => ({
  user_id: get_or_create_user_id(),

  // Chat
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChat: () => set({ chatMessages: [] }),

  // Resume
  resume: initialResumeState,
  set_resume: (resume) => set({ resume }),
  update_resume: (patch) =>
    set((state) => {
      if (!state.resume) return {};
      return {
        resume: {
          ...state.resume,
          ...patch,
        },
      };
    }),
  apply_actions: (actions) =>
    set((state) => {
      if (!state.resume) {
        return {};
      }

      const next = { ...state.resume };

      const append_unique = (target: string[], values: string[]) => {
        const merged = new Set([...target, ...values]);
        return [...merged].filter((item) => item.trim().length > 0);
      };

      for (const action of actions) {
        switch (action.type) {
          case 'update_summary':
            if (action.content) {
              next.summary = action.content;
            }
            break;
          case 'update_skills':
            if (action.skills?.length) {
              next.skills = append_unique(next.skills, action.skills);
            }
            break;
          case 'rewrite_bullet':
            if (action.content && action.section) {
              const key = action.section as keyof ResumeData;
              const current = next[key];
              if (Array.isArray(current) && current.length > 0) {
                current[0] = action.content;
              } else if (Array.isArray(current)) {
                current.push(action.content);
              }
            }
            break;
          case 'add_section':
            if (action.section === 'projects' && action.content) {
              next.projects = [...next.projects, action.content];
            }
            if (action.section === 'experience' && action.content) {
              next.experience = [...next.experience, action.content];
            }
            break;
          case 'add_project':
            if (action.content) {
              next.projects = [...next.projects, action.content];
            }
            break;
          case 'remove_section':
          case 'reorder_sections':
          case 'design_recommendation':
            break;
          default:
            break;
        }
      }

      return { resume: next };
    }),

  // Template
  selectedTemplate: 'template1',
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  templateSettings: {
    font: 'inter',
    fontSize: 11,
    color: '#1e293b',
    spacing: 1,
    lineHeight: 1.5,
  },
  updateTemplateSettings: (settings) =>
    set((state) => ({
      templateSettings: {
        ...state.templateSettings,
        ...settings,
      },
    })),

  // Job matching
  jobDescription: '',
  setJobDescription: (description) => set({ jobDescription: description }),
  jobMatchAnalysis: null,
  setJobMatchAnalysis: (analysis) => set({ jobMatchAnalysis: analysis }),

  // UI state
  currentPage: 'chat',
  setCurrentPage: (page) => set({ currentPage: page }),
}));
