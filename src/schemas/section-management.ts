import { z } from "zod";

export const SectionTypeSchema = z.enum(["list", "text", "bullet", "table"]);

export const SectionConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  order: z.number(),
  type: SectionTypeSchema,
  content: z.array(z.unknown()),
  isCustom: z.boolean().optional(),
  icon: z.string().optional(),
});

export const SectionManagerStateSchema = z.object({
  sections: z.array(SectionConfigSchema),
  experienceLevel: z.enum(["fresher", "intermediate", "experienced", "senior"]),
});

export const SaveSectionsPayloadSchema = z.object({
  userId: z.string().uuid(),
  sections: z.array(SectionConfigSchema),
  resumeId: z.string().uuid().optional(),
});

export type SectionConfig = z.infer<typeof SectionConfigSchema>;
export type SectionManagerState = z.infer<typeof SectionManagerStateSchema>;
export type SaveSectionsPayload = z.infer<typeof SaveSectionsPayloadSchema>;
