import { useCallback, useState } from "react";
import type { ExperienceLevel, SectionConfig } from "../types/section-management";
import {
  createCustomSection,
  deleteCustomSection,
  disableSection,
  enableSection,
  initializeSectionsForExperience,
  prioritizeSectionsByExperience,
  reorderSections,
  searchSections,
  toggleSection,
  updateSectionContent,
} from "../utils/section-utils";

interface UseSectionManagerOptions {
  initialExperience?: ExperienceLevel;
  initialSections?: SectionConfig[];
}

export function useSectionManager(options: UseSectionManagerOptions = {}) {
  const { initialExperience = "intermediate", initialSections } = options;

  const [sections, setSections] = useState<SectionConfig[]>(
    initialSections || initializeSectionsForExperience(initialExperience),
  );
  const [experience, setExperience] = useState<ExperienceLevel>(initialExperience);
  const [searchQuery, setSearchQuery] = useState("");

  const hiddenSections = sections.filter((s) => !s.enabled);
  const visibleSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const searchResults = searchQuery.trim() ? searchSections(hiddenSections, searchQuery) : [];

  const handleToggleSection = useCallback((sectionId: string) => {
    setSections((current) => toggleSection(current, sectionId));
  }, []);

  const handleEnableSection = useCallback((sectionId: string) => {
    setSections((current) => enableSection(current, sectionId));
    setSearchQuery("");
  }, []);

  const handleDisableSection = useCallback((sectionId: string) => {
    setSections((current) => disableSection(current, sectionId));
  }, []);

  const handleReorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setSections((current) => {
      const visibleOnly = current.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
      const reordered = reorderSections(visibleOnly, fromIndex, toIndex);

      // Merge back with disabled sections maintaining their state
      const disabled = current.filter((s) => !s.enabled);
      const maxOrder = Math.max(...reordered.map((s) => s.order), 0);
      const updatedDisabled = disabled.map((s, idx) => ({
        ...s,
        order: maxOrder + idx + 1,
      }));

      return [...reordered, ...updatedDisabled];
    });
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCreateCustomSection = useCallback(
    (name: string, type: "list" | "text" | "bullet" | "table") => {
      setSections((current) => createCustomSection(current, name, type));
      setSearchQuery("");
    },
    [],
  );

  const handleDeleteCustomSection = useCallback((sectionId: string) => {
    setSections((current) => deleteCustomSection(current, sectionId));
  }, []);

  const handleUpdateSectionContent = useCallback(
    (sectionId: string, content: unknown[]) => {
      setSections((current) => updateSectionContent(current, sectionId, content));
    },
    [],
  );

  const handleChangeExperience = useCallback((newExperience: ExperienceLevel) => {
    setExperience(newExperience);
    const prioritized = prioritizeSectionsByExperience(
      initializeSectionsForExperience(newExperience),
      newExperience,
    );
    setSections(prioritized);
  }, []);

  return {
    sections,
    visibleSections,
    hiddenSections,
    searchResults,
    searchQuery,
    experience,
    actions: {
      toggleSection: handleToggleSection,
      enableSection: handleEnableSection,
      disableSection: handleDisableSection,
      reorderSections: handleReorderSections,
      searchSections: handleSearchChange,
      createCustomSection: handleCreateCustomSection,
      deleteCustomSection: handleDeleteCustomSection,
      updateSectionContent: handleUpdateSectionContent,
      changeExperience: handleChangeExperience,
    },
  };
}
