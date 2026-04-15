import {
  CORE_SECTIONS,
  SECONDARY_SECTIONS,
  HIDDEN_SECTIONS,
  EXPERIENCE_LEVEL_PRIORITIES,
} from "../types/section-management";
import type { ExperienceLevel, SectionConfig } from "../types/section-management";

export function searchSections(
  sections: SectionConfig[],
  query: string,
): SectionConfig[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return sections.filter((section) =>
    section.label.toLowerCase().includes(lowerQuery) ||
    section.id.toLowerCase().includes(lowerQuery),
  );
}

export function reorderSections(
  sections: SectionConfig[],
  fromIndex: number,
  toIndex: number,
): SectionConfig[] {
  const result = [...sections];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  return result.map((section, index) => ({
    ...section,
    order: index,
  }));
}

export function enableSection(sections: SectionConfig[], sectionId: string): SectionConfig[] {
  return sections.map((section) =>
    section.id === sectionId ? { ...section, enabled: true } : section,
  );
}

export function disableSection(sections: SectionConfig[], sectionId: string): SectionConfig[] {
  return sections.map((section) =>
    section.id === sectionId ? { ...section, enabled: false } : section,
  );
}

export function toggleSection(sections: SectionConfig[], sectionId: string): SectionConfig[] {
  return sections.map((section) =>
    section.id === sectionId ? { ...section, enabled: !section.enabled } : section,
  );
}

export function createCustomSection(
  sections: SectionConfig[],
  name: string,
  type: "list" | "text" | "bullet" | "table",
): SectionConfig[] {
  const customId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const order = Math.max(...sections.map((s) => s.order), 0) + 1;

  const newSection: SectionConfig = {
    id: customId,
    label: name,
    enabled: true,
    order,
    type,
    content: [],
    isCustom: true,
  };

  return [...sections, newSection];
}

export function deleteCustomSection(sections: SectionConfig[], sectionId: string): SectionConfig[] {
  return sections
    .filter((section) => !(section.id === sectionId && section.isCustom))
    .map((section, index) => ({
      ...section,
      order: index,
    }));
}

export function updateSectionContent(
  sections: SectionConfig[],
  sectionId: string,
  content: unknown[],
): SectionConfig[] {
  return sections.map((section) =>
    section.id === sectionId ? { ...section, content } : section,
  );
}

export function getVisibleSections(sections: SectionConfig[]): SectionConfig[] {
  return sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
}

export function getDisabledSections(sections: SectionConfig[]): SectionConfig[] {
  return sections.filter((s) => !s.enabled).sort((a, b) => a.order - b.order);
}

export function prioritizeSectionsByExperience(
  sections: SectionConfig[],
  experience: ExperienceLevel,
): SectionConfig[] {
  const priorities = EXPERIENCE_LEVEL_PRIORITIES[experience];
  const priorityMap = new Map(priorities.map((id, index) => [id, index]));

  return [...sections].sort((a, b) => {
    const aPriority = priorityMap.get(a.id) ?? 999;
    const bPriority = priorityMap.get(b.id) ?? 999;
    return aPriority - bPriority;
  });
}

export function initializeSectionsForExperience(
  experience: ExperienceLevel,
): SectionConfig[] {
  const allSections: SectionConfig[] = [];
  let order = 0;

  // Always add core sections in priority order
  const coreIds = Object.keys(CORE_SECTIONS) as Array<keyof typeof CORE_SECTIONS>;
  coreIds.forEach((key) => {
    const section = CORE_SECTIONS[key];
    allSections.push({
      ...section,
      order: order++,
      content: [],
    });
  });

  // Add secondary sections based on experience
  const secondaryIds = Object.keys(SECONDARY_SECTIONS) as Array<keyof typeof SECONDARY_SECTIONS>;
  secondaryIds.forEach((key) => {
    const section = SECONDARY_SECTIONS[key];
    const shouldEnable =
      experience === "fresher"
        ? key === "projects"
        : ["intermediate", "experienced"].includes(experience)
          ? key === "projects"
          : false;

    allSections.push({
      ...section,
      enabled: shouldEnable,
      order: order++,
      content: [],
    });
  });

  // Add hidden sections
  const hiddenIds = Object.keys(HIDDEN_SECTIONS) as Array<keyof typeof HIDDEN_SECTIONS>;
  hiddenIds.forEach((key) => {
    const section = HIDDEN_SECTIONS[key];
    allSections.push({
      ...section,
      order: order++,
      content: [],
    });
  });

  return allSections;
}

export function validateSectionName(name: string): string | null {
  if (!name.trim()) return "Section name cannot be empty";
  if (name.length > 50) return "Section name must be under 50 characters";
  if (!/^[a-zA-Z0-9\s\-\/&()]+$/.test(name)) return "Invalid characters in section name";
  return null;
}
