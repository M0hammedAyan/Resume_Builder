import { Eye, EyeOff } from "lucide-react";
import type { SectionConfig } from "../../types/section-management";

interface SecondaryToggleProps {
  sections: SectionConfig[];
  onToggle: (sectionId: string) => void;
}

export function SecondaryToggle({ sections, onToggle }: SecondaryToggleProps) {
  // Filter secondary sections (projects, certifications, achievements)
  const secondarySectionIds = ["projects", "certifications", "achievements"];
  const secondarySections = sections.filter((s) => secondarySectionIds.includes(s.id));

  if (secondarySections.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Optional Sections
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {secondarySections.map((section) => (
          <button
            key={section.id}
            onClick={() => onToggle(section.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
              section.enabled
                ? "border-cyan-500 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500"
            }`}
          >
            {section.enabled ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
