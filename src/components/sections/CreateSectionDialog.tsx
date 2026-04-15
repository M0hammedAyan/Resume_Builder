import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { SectionType } from "../../types/section-management";
import { validateSectionName } from "../../utils/section-utils";

interface CreateSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: SectionType) => void;
  suggestedName?: string;
}

const SECTION_TYPES: Array<{ value: SectionType; label: string; description: string }> = [
  { value: "list", label: "List", description: "Comma-separated entries" },
  { value: "bullet", label: "Bullet Points", description: "Indented bullet list" },
  { value: "text", label: "Text", description: "Long-form paragraph" },
  { value: "table", label: "Table", description: "Structured data table" },
];

export function CreateSectionDialog({
  isOpen,
  onClose,
  onCreate,
  suggestedName = "",
}: CreateSectionDialogProps) {
  const [name, setName] = useState(suggestedName);
  const [selectedType, setSelectedType] = useState<SectionType>("bullet");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const validationError = validateSectionName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onCreate(name, selectedType);
    setName("");
    setSelectedType("bullet");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create New Section
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Publications, Speaking Engagements"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Content Type
            </label>
            <div className="mt-2 space-y-2">
              {SECTION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/50"
                >
                  <input
                    type="radio"
                    name="section-type"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={() => setSelectedType(type.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {type.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/50">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
