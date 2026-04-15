import { Search, X } from "lucide-react";
import type { SectionConfig } from "../../types/section-management";

interface SectionSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SectionSearchBar({
  value,
  onChange,
  placeholder = "Search sections...",
  onClear,
}: SectionSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-400"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface SectionListItemProps {
  section: SectionConfig;
  onAdd?: (section: SectionConfig) => void;
  onRemove?: (sectionId: string) => void;
  isHidden?: boolean;
  isDragging?: boolean;
}

export function SectionListItem({
  section,
  onAdd,
  onRemove,
  isHidden = false,
  isDragging = false,
}: SectionListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
        isDragging
          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
          : isHidden
            ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.label}</p>
        {section.isCustom && (
          <p className="text-xs text-slate-500 dark:text-slate-400">Custom • {section.type}</p>
        )}
      </div>

      <div className="flex gap-2">
        {isHidden && onAdd && (
          <button
            onClick={() => onAdd(section)}
            className="rounded px-3 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
          >
            Add
          </button>
        )}

        {section.isCustom && onRemove && (
          <button
            onClick={() => onRemove(section.id)}
            className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
