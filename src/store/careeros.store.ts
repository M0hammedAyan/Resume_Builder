import { create } from 'zustand';
import type { ChatMessage, ResumeSectionData, ResumeSection } from '../types/resume';

export interface ResumeData {
  id: string;
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  sections: ResumeSectionData[];
}

export interface JobMatchAnalysis {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
  suggestions: string[];
}

export interface CareerOSStore {
  // Chat state
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Resume state
  resume: ResumeData | null;
  setResume: (resume: ResumeData) => void;
  updateResumeSection: (section: ResumeSection, data: ResumeSectionData) => void;
  updateResumeHeader: (header: Partial<ResumeData['header']>) => void;

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
  id: 'default-resume',
  header: {
    name: 'MOHAMMED AYAN',
    title: '',
    email: 'mohammedayan262005@gmail.com',
    phone: '+91 6361937273',
    location: 'Bengaluru, Karnataka, India',
  },
  summary: 'AI/ML and computer vision student with hands-on experience in building real-time monitoring systems, multi-camera vision pipelines, and IoT-integrated hardware solutions. Currently working at the Indian Institute of Science on medical video analysis systems, focusing on performance optimization, system integration, and secure data handling. Skilled in Python, OpenCV, and data-driven system design, with a strong interest in scalable, secure digital infrastructure and identity systems.',
  sections: [
    {
      section: 'experience',
      title: 'Experience',
      bullets: [
        {
          id: 'exp-1',
          section: 'experience',
          content: 'Research IISc Intern, Indian Institute of Science (IISc), Bengaluru (Feb 2026 - Present): Designed and engineered a custom 3D multi-camera mount; developed a multi-camera monitoring system (Action Cam + Intel RealSense); built a real-time video processing pipeline (30-60 FPS); engineered an IoT-integrated hardware setup; implementing secure data transmission for sensitive video data; developing a PyQt GUI for real-time control and monitoring; optimized integration of hardware, software, and AI components.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-2',
          section: 'experience',
          content: 'Attendance & Risk Analysis System (Open Source): Architecting scalable role-based platform (Admin, HOD, Mentor, Teacher), designed end-to-end data pipeline for attendance tracking and predictive risk analytics, collaborating in a 4-member team with structured version control workflows.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-3',
          section: 'experience',
          content: 'CareerOS (AI-powered professional profile assistant): Engineered a system transforming raw career data into ATS-optimized, role-specific resumes; developing explainable decision engine using structured memory, vector retrieval, and scoring.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-4',
          section: 'experience',
          content: 'FloodGuard (Astrava Hackathon 2025): Built real-time flood prediction using sensor data and ML models; automated Telegram early warning alerts to improve response time.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-5',
          section: 'experience',
          content: 'Dual-Agent Multimodal AI Framework for Driver State Monitoring: Built Python multimodal AI for driver fatigue/distraction detection and implemented agent-based architecture for visual and behavioral streams (Publication: Nov 2025).',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-6',
          section: 'experience',
          content: 'Magnetic Yoke (NDT): Constructed a magnetic yoke-based NDT system for detecting surface and subsurface defects in ferromagnetic materials.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      section: 'projects',
      title: 'Projects',
      bullets: [
        {
          id: 'proj-1',
          section: 'projects',
          content: 'Attendance & Risk Analysis System (Open Source): Architecting scalable role-based platform (Admin, HOD, Mentor, Teacher), designed end-to-end data pipeline for attendance tracking and predictive risk analytics, collaborating in a 4-member team with structured version control workflows.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proj-2',
          section: 'projects',
          content: 'CareerOS (AI-powered professional profile assistant): Engineered a system transforming raw career data into ATS-optimized, role-specific resumes; developing explainable decision engine using structured memory, vector retrieval, and scoring.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proj-3',
          section: 'projects',
          content: 'FloodGuard (Astrava Hackathon 2025): Built real-time flood prediction using sensor data and ML models; automated Telegram early warning alerts to improve response time.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proj-4',
          section: 'projects',
          content: 'Dual-Agent Multimodal AI Framework for Driver State Monitoring: Built Python multimodal AI for driver fatigue/distraction detection and implemented agent-based architecture for visual and behavioral streams (Publication: Nov 2025).',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'proj-5',
          section: 'projects',
          content: 'Magnetic Yoke (NDT): Constructed a magnetic yoke-based NDT system for detecting surface and subsurface defects in ferromagnetic materials.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      section: 'education',
      title: 'Education',
      bullets: [
        {
          id: 'edu-1',
          section: 'education',
          content: 'B.E. in Artificial Intelligence & Machine Learning, Dr. Ambedkar Institute of Technology, Bengaluru (Oct 2024-Present), CGPA: 6.90',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'edu-2',
          section: 'education',
          content: 'Diploma in Mechanical Engineering, M.N. Technical Institute, Bengaluru (Jun 2021-2024), CGPA: 9.77',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      section: 'skills',
      title: 'Skills',
      bullets: [
        {
          id: 'sk-1',
          section: 'skills',
          content: 'Programming: Python',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-2',
          section: 'skills',
          content: 'AI & ML: Model Training, Model Evaluation, Deep Learning, NLP, LLM Fundamentals, Prompt Engineering, Gen AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-3',
          section: 'skills',
          content: 'Computer Vision: OpenCV, Image Processing, Real-Time Detection, Multi-Camera Systems',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-4',
          section: 'skills',
          content: 'Mechanical Engineering: SolidWorks, AutoCAD, Additive Manufacturing, Non-Destructive Testing (NDT)',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-5',
          section: 'skills',
          content: 'Tools & Platforms: Git, GitHub, Linux, PyQt',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-6',
          section: 'skills',
          content: 'Data & Visualization: Pandas, Tableau',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sk-7',
          section: 'skills',
          content: 'Soft Skills: Attention to Detail, Public Speaking, Leadership, Adaptability/Flexibility, Time Management, Presentation',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ],
};

export const useCareerOSStore = create<CareerOSStore>((set) => ({
  // Chat
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChat: () => set({ chatMessages: [] }),

  // Resume
  resume: initialResumeState,
  setResume: (resume) => set({ resume }),
  updateResumeSection: (section, data) =>
    set((state) => {
      if (!state.resume) return {};
      const updatedSections = state.resume.sections.map((s) =>
        s.section === section ? data : s
      );
      return {
        resume: {
          ...state.resume,
          sections: updatedSections,
        },
      };
    }),
  updateResumeHeader: (header) =>
    set((state) => {
      if (!state.resume) return {};
      return {
        resume: {
          ...state.resume,
          header: {
            ...state.resume.header,
            ...header,
          },
        },
      };
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
