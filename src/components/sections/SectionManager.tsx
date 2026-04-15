import { Plus, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ExperienceLevel } from "../../types/section-management";
import { useSectionManager } from "../../hooks/useSectionManager";
import { CreateSectionDialog } from "./CreateSectionDialog";
import { DraggableSectionList } from "./DraggableSectionList";
import { SectionListItem, SectionSearchBar } from "./SectionSearchBar";
import { SecondaryToggle } from "./SecondaryToggle";

interface SectionManagerProps {
  experienceLevel?: ExperienceLevel;
  onSectionsChange?: (sections: typeof import("../../types/section-management").SectionConfig[]) => void;
}

export function SectionManager({
  experienceLevel = "intermediate",
  onSectionsChange,
}: SectionManagerProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");

  const {
    sections,
    visibleSections,
    hiddenSections,
    searchResults,
    searchQuery,
    experience,
    actions,
  } = useSectionManager({
    initialExperience: experienceLevel,
  });

  useEffect(() => {
    onSectionsChange?.(sections);
  }, [onSectionsChange, sections]);

  // Notify parent of changes
  const handleToggleSection = (sectionId: string) => {
    actions.toggleSection(sectionId);
  };

  const handleEnableSection = (sectionId: string) => {
    actions.enableSection(sectionId);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    actions.reorderSections(fromIndex, toIndex);
  };

  const handleSearch = (query: string) => {
    actions.searchSections(query);
  };

  const handleAddFromSearch = (sectionId: string) => {
    handleEnableSection(sectionId);
  };

  const handleCreateCustom = (name: string, type: "list" | "text" | "bullet" | "table") => {
    actions.createCustomSection(name, type);
    setSuggestedName("");
  };

  const handleDeleteCustom = (sectionId: string) => {
    actions.deleteCustomSection(sectionId);
  };

  const handleChangeExperience = (level: ExperienceLevel) => {
    actions.changeExperience(level);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Resume Sections
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Customize which sections appear in your resume
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={experience}
            onChange={(e) => handleChangeExperience(e.target.value as ExperienceLevel)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="fresher">Fresher</option>
            <option value="intermediate">Intermediate</option>
            <option value="experienced">Experienced</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      {/* Core Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Core Sections
          </p>
        </div>

        <DraggableSectionList
          sections={visibleSections.filter((s) =>
            ["header", "summary", "skills", "experience", "education"].includes(s.id),
          )}
          onReorder={handleReorder}
          onToggle={handleToggleSection}
        />
      </div>

      {/* Secondary Sections Toggle */}
      <SecondaryToggle sections={sections} onToggle={actions.toggleSection} />

      {/* Add Section Button */}
      <button
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700"
      >
        <Plus className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        <span className="font-medium text-slate-600 dark:text-slate-400">Add Section</span>
      </button>

      {/* Search & Add Panel */}
      {isSearchOpen && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Add Hidden Sections
            </p>
            <SectionSearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search Publications, Research, Volunteer..."
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Found {searchResults.length} section{searchResults.length !== 1 ? "s" : ""}
              </p>
              {searchResults.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isHidden
                  onAdd={() => handleAddFromSearch(section.id)}
                />
              ))}
            </div>
          )}

          {/* No Results - Create Custom */}
          {searchQuery && searchResults.length === 0 && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSuggestedName(searchQuery);
                  setIsCreateDialogOpen(true);
                  setIsSearchOpen(false);
                }}
                className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                Create "{searchQuery}" Section
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                or browse all hidden sections below
              </p>
            </div>
          )}

          {/* All Hidden Sections */}
          {!searchQuery && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {hiddenSections.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isHidden
                  onAdd={() => handleAddFromSearch(section.id)}
                  onRemove={section.isCustom ? handleDeleteCustom : undefined}
                />
              ))}
            </div>
          )}

          {/* Manual Create Button */}
          <button
            onClick={() => {
              setSuggestedName("");
              setIsCreateDialogOpen(true);
              setIsSearchOpen(false);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            + Create Custom Section
          </button>
        </div>
      )}

      {/* Create Section Dialog */}
      <CreateSectionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSuggestedName("");
        }}
        onCreate={handleCreateCustom}
        suggestedName={suggestedName}
      />

      {/* Enabled Sections Summary */}
      <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold">{visibleSections.length}</span> section
          {visibleSections.length !== 1 ? "s" : ""} visible •
          <span className="ml-1 font-semibold">{hiddenSections.length}</span> hidden
        </p>
      </div>
    </div>
  );
}
