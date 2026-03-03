export interface ResumeEntry {
  title: string
  description?: string
  bullets?: string[]
}

export interface Profile {
  education: ResumeEntry[]
  experience: ResumeEntry[]
  projects: ResumeEntry[]
  skills: ResumeEntry[]
  achievements: ResumeEntry[]
  patents: ResumeEntry[]
  certifications: ResumeEntry[]
  documents?: DocumentData[]
}

export interface DocumentData {
  fileName: string
  importedAt: string
  rawContent: string
  sections: Record<string, string[]>
}

export interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isFile?: boolean
  fileName?: string
}

export interface Suggestion {
  category: string
  resumeEntry?: ResumeEntry
  resumeBullets?: string[]
  data: ResumeEntry & { rawText?: string; fileName?: string; importedAt?: string; sections?: Record<string, string[]> }
  isDocumentImport?: boolean
  source?: string
}

export interface AIResponse {
  message: string
  suggestion?: Suggestion
}

export interface UpdateStatus {
  visible: boolean
  section: string | null
}
