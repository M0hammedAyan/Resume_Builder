import { useState } from "react";
import type { ExperienceLevel } from "../../types/section-management";
import { SectionDisplay, SectionManager } from "../sections";
import { useSectionManager } from "../../hooks/useSectionManager";

/**
 * Example: Complete Resume Builder with Section Management
 *
 * This demonstrates how to integrate the section management system
 * into a full resume builder flow.
 */
export function ResumeBuilderExample() {
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [userExperience, setUserExperience] = useState<ExperienceLevel>("intermediate");

  const { sections, visibleSections, actions } = useSectionManager({
    initialExperience: userExperience,
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Section Manager */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Sections
            </h3>
            <button
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {isEditingLayout ? "Done" : "Edit"}
            </button>
          </div>

          {isEditingLayout ? (
            <SectionManager
              experienceLevel={userExperience}
              onSectionsChange={(updatedSections) => {
                // Update parent or store
                console.log("Sections updated:", updatedSections);
              }}
            />
          ) : (
            // Simple section list view
            <div className="space-y-1">
              {visibleSections.map((section) => (
                <div
                  key={section.id}
                  className="rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {section.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Resume Preview */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Your Name
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            your.email@example.com • (123) 456-7890
          </p>

          <div className="mt-6">
            <SectionDisplay sections={visibleSections} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Simple Section Toggle Component
 */
export function SectionToggleExample() {
  const { sections, actions } = useSectionManager();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Visible Sections</h2>

      <div className="space-y-2">
        {sections
          .filter((s) => s.enabled)
          .map((section) => (
            <div key={section.id} className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">{section.label}</span>
              <button
                onClick={() => actions.disableSection(section.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Hide
              </button>
            </div>
          ))}
      </div>

      <h2 className="mt-6 text-lg font-semibold">Hidden Sections</h2>

      <div className="space-y-2">
        {sections
          .filter((s) => !s.enabled)
          .map((section) => (
            <div key={section.id} className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium text-slate-600">{section.label}</span>
              <button
                onClick={() => actions.enableSection(section.id)}
                className="text-xs text-cyan-600 hover:text-cyan-700"
              >
                Show
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Example: Experience Level Switcher
 */
export function ExperienceLevelSwitcher() {
  const { experience, actions } = useSectionManager();

  const levels: Array<{ value: ExperienceLevel; label: string; description: string }> = [
    {
      value: "fresher",
      label: "Fresher",
      description: "New to the workforce - emphasize projects and education",
    },
    {
      value: "intermediate",
      label: "Intermediate",
      description: "2-5 years experience - balance all sections",
    },
    {
      value: "experienced",
      label: "Experienced",
      description: "5+ years - emphasize experience and achievements",
    },
    {
      value: "senior",
      label: "Senior",
      description: "10+ years - focus on leadership and impact",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Career Level</h2>
      <p className="text-sm text-slate-600">
        This helps optimize which sections are shown by default
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => actions.changeExperience(level.value)}
            className={`rounded-lg border-2 p-3 text-left transition ${
              experience === level.value
                ? "border-cyan-600 bg-cyan-50 dark:bg-cyan-900/30"
                : "border-slate-300 hover:border-slate-400 dark:border-slate-600"
            }`}
          >
            <p className="font-semibold">{level.label}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {level.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Drag-and-Drop Reordering
 */
export function DragReorderExample() {
  const { visibleSections, actions } = useSectionManager();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Reorder Sections</h2>
      <p className="text-sm text-slate-600">Drag sections to reorder them</p>

      <div className="space-y-2">
        {visibleSections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => {
              /* handle drag start */
            }}
            onDrop={() => {
              /* handle drop */
            }}
            className="flex cursor-move items-center gap-3 rounded-lg border bg-white p-3 hover:shadow-md"
          >
            <div className="font-semibold">⋮⋮</div>
            <span>{section.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Search and Add Sections
 */
export function SearchAddExample() {
  const [query, setQuery] = useState("");
  const { searchResults, actions } = useSectionManager();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Add More Sections</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => actions.searchSections(e.target.value)}
        placeholder="Search: Research, Publications, Volunteer..."
        className="w-full rounded-lg border px-3 py-2 text-slate-900"
      />

      {query && searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">
            Found {searchResults.length} sections
          </p>
          {searchResults.map((section) => (
            <button
              key={section.id}
              onClick={() => actions.enableSection(section.id)}
              className="w-full rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-left font-medium text-cyan-900 hover:bg-cyan-100"
            >
              + {section.label}
            </button>
          ))}
        </div>
      )}

      {query && searchResults.length === 0 && (
        <button
          onClick={() => {
            actions.createCustomSection(query, "bullet");
            setQuery("");
          }}
          className="w-full rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-900"
        >
          Create "{query}" Section
        </button>
      )}
    </div>
  );
}
