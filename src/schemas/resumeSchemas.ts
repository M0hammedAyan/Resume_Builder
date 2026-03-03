import { z } from 'zod'

export const resumeEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  bullets: z.array(z.string()).optional()
})

export const educationSchema = z.object({
  title: z.string().min(1, 'Degree/Course is required'),
  description: z.string().min(1, 'Institution is required'),
  bullets: z.array(z.string()).optional()
})

export const experienceSchema = z.object({
  title: z.string().min(1, 'Position is required'),
  description: z.string().min(1, 'Company is required'),
  bullets: z.array(z.string()).min(1, 'At least one responsibility is required')
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  bullets: z.array(z.string()).optional()
})

export const skillSchema = z.object({
  title: z.string().min(1, 'Skill is required')
})

export type ResumeEntryInput = z.infer<typeof resumeEntrySchema>
export type EducationInput = z.infer<typeof educationSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type SkillInput = z.infer<typeof skillSchema>
