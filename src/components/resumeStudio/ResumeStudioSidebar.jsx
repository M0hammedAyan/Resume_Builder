import { Search, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const presetSections = [
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
];

function ResumeStudioSidebar({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  isOpen,
  onToggleOpen,
  saveStatus,
  onCreateCustomSection,
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return presetSections;
    }

    const matches = presetSections.filter((item) => item.label.toLowerCase().includes(value));
    if (matches.length > 0) {
      return matches;
    }

    return [
      {
        key: "custom",
        label: `Create "${query.trim()}"`,
      },
    ];
  }, [query]);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onToggleOpen}
          className="fixed inset-0 z-20 bg-slate-950/20 backdrop-blur-[1px] md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[min(88vw,20rem)] flex-col border-r border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur transition-transform duration-200 md:sticky md:top-6 md:z-auto md:h-[calc(100vh-3rem)] md:w-auto md:translate-x-0 md:rounded-[1.75rem] md:border md:shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
            <p className="text-sm text-slate-600">Navigate your resume</p>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden items-center justify-between gap-3 md:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
            <p className="text-sm text-slate-600">Navigate your resume</p>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 md:hidden"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>

        <Button
          type="button"
          onClick={() => searchRef.current?.focus()}
          className="mt-3 w-full justify-center"
          variant="secondary"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Section
        </Button>

        <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search or create"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="space-y-2">
            {suggestions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === "custom") {
                    onCreateCustomSection(query.trim());
                  } else {
                    onAddSection(item.key);
                  }
                  setQuery("");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">Add</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Save status</p>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{saveStatus}</span>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  activeSectionId === section.id
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/10"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{section.title}</span>
                  <span className={`text-[11px] uppercase tracking-[0.16em] ${activeSectionId === section.id ? "text-white/70" : "text-slate-400"}`}>
                    {section.isEmpty ? "Empty" : "Filled"}
                  </span>
                </div>
                <p className={`mt-1 line-clamp-2 text-xs ${activeSectionId === section.id ? "text-white/70" : "text-slate-500"}`}>
                  {section.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export default ResumeStudioSidebar;
