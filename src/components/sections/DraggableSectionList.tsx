import { GripVertical, X } from "lucide-react";
import { useState } from "react";
import type { SectionConfig } from "../../types/section-management";

interface DraggableSectionListProps {
  sections: SectionConfig[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggle: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
}

export function DraggableSectionList({
  sections,
  onReorder,
  onToggle,
  onDelete,
}: DraggableSectionListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    onReorder(draggedIndex, index);
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={() => handleDragOver(index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`group flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
            draggedIndex === index
              ? "border-cyan-500 bg-cyan-100 opacity-50 dark:bg-cyan-900/30"
              : overIndex === index
                ? "border-cyan-400 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          } cursor-grab active:cursor-grabbing`}
        >
          <GripVertical className="h-5 w-5 text-slate-400 opacity-0 transition group-hover:opacity-100 dark:text-slate-500" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {section.label}
            </p>
            {section.isCustom && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Custom • {section.type}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(section.id)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Hide
            </button>

            {section.isCustom && onDelete && (
              <button
                onClick={() => onDelete(section.id)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
