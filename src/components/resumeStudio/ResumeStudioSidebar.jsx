import { Search, Plus, PanelsTopLeft, Grip, CircleDot } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";

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

  if (!isOpen) {
    return (
      <aside className="sticky top-5 hidden h-[calc(100vh-7.75rem)] w-[74px] flex-col items-center rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-sm lg:flex">
        <button
          type="button"
          onClick={onToggleOpen}
          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <Grip className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onAddSection("projects")}
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="Add section"
          title="Add section"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold transition ${
                activeSectionId === section.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={`Open ${section.title}`}
              title={section.title}
            >
              {section.title.slice(0, 1).toUpperCase() || <CircleDot className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <div className="w-full border-t border-slate-200 pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {saveStatus === "Saved" ? "OK" : "..."}
        </div>
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onToggleOpen}
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
      />
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,290px)] flex-col border-r border-slate-200/80 bg-white/95 p-4 shadow-xl lg:sticky lg:top-5 lg:z-auto lg:h-[calc(100vh-7.75rem)] lg:w-[290px] lg:rounded-2xl lg:border lg:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
          <p className="text-sm text-slate-600">Navigate and organize</p>
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelsTopLeft className="h-4 w-4" />
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
