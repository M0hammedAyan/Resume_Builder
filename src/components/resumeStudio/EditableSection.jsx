import { forwardRef, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, PencilLine, Trash2 } from "lucide-react";
import AISuggestionCard from "./AISuggestionCard.jsx";

function InlineEditableField({ value, placeholder, multiline = false, onCommit, className = "", labelClassName = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
    }
  }, [editing, value]);

  const commit = () => {
    const next = draft;
    setEditing(false);
    if ((next ?? "") !== (value ?? "")) {
      onCommit(next);
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-2 ring-slate-200 focus:border-slate-400 focus:ring-slate-300 ${className}`}
          rows={3}
        />
      );
    }

    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-2 ring-slate-200 focus:border-slate-400 focus:ring-slate-300 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50 ${className}`}
    >
      <span className={`block whitespace-pre-wrap text-sm leading-6 ${value?.trim() ? "text-slate-900" : `text-slate-400 ${labelClassName}`}`}>
        {value?.trim() ? value : placeholder}
      </span>
    </button>
  );
}

const EditableSection = forwardRef(function EditableSection(
  {
    section,
    isActive,
    onSelect,
    onRenameSection,
    onDeleteSection,
    onMoveSection,
    onUpdatePersonalField,
    onUpdateListItem,
    onAddListItem,
    onRemoveListItem,
    onUpdateSectionContent,
    onUpdateSectionTitle,
    onImproveDescription,
  },
  ref,
) {
  const statusLabel = useMemo(() => (section.isEmpty ? "Click to add content" : ""), [section.isEmpty]);

  return (
    <article
      ref={ref}
      id={section.id}
      className={`scroll-mt-6 rounded-3xl border bg-white p-5 shadow-sm shadow-slate-200/60 transition ${
        isActive ? "border-slate-300 ring-1 ring-slate-200" : "border-slate-200 hover:border-slate-300"
      }`}
      onClick={onSelect}
    >
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <InlineEditableField
              value={section.title}
              placeholder="Section title"
              onCommit={(next) => onUpdateSectionTitle(section.id, next)}
              className="px-0 py-0"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRenameSection(section.id);
              }}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              aria-label="Rename section"
            >
              <PencilLine className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">{section.description || statusLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          {section.canMove ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveSection(section.id, "up");
                }}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Move section up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveSection(section.id, "down");
                }}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Move section down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </>
          ) : null}
          {section.canDelete ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteSection(section.id);
              }}
              className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 transition hover:bg-rose-50"
              aria-label="Delete section"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="pt-5">
        {section.type === "personal" ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InlineEditableField
                value={section.fields.name}
                placeholder="Full name"
                onCommit={(next) => onUpdatePersonalField(section.id, "name", next)}
              />
              <InlineEditableField
                value={section.fields.email}
                placeholder="Email"
                onCommit={(next) => onUpdatePersonalField(section.id, "email", next)}
              />
              <InlineEditableField
                value={section.fields.phone}
                placeholder="Phone"
                onCommit={(next) => onUpdatePersonalField(section.id, "phone", next)}
              />
              <InlineEditableField
                value={section.fields.links}
                placeholder="Links, portfolio, GitHub"
                onCommit={(next) => onUpdatePersonalField(section.id, "links", next)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</p>
              <InlineEditableField
                value={section.fields.summary}
                placeholder="Click to add your summary"
                multiline
                onCommit={(next) => onUpdatePersonalField(section.id, "summary", next)}
              />
            </div>
          </div>
        ) : null}

        {section.type === "education" ? (
          <div className="space-y-3">
            {section.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Click to add your education
              </div>
            ) : null}
            {section.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InlineEditableField value={item.institution} placeholder="Institution" onCommit={(next) => onUpdateListItem(section.id, item.id, "institution", next)} />
                  <InlineEditableField value={item.degree} placeholder="Degree" onCommit={(next) => onUpdateListItem(section.id, item.id, "degree", next)} />
                  <InlineEditableField value={item.year} placeholder="Year" onCommit={(next) => onUpdateListItem(section.id, item.id, "year", next)} />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveListItem(section.id, item.id);
                    }}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddListItem(section.id);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add education
            </button>
          </div>
        ) : null}

        {section.type === "experience" || section.type === "project" ? (
          <div className="space-y-3">
            {section.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Click to add your {section.type === "experience" ? "experience" : "projects"}
              </div>
            ) : null}

            {section.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InlineEditableField
                    value={item.title}
                    placeholder={section.type === "experience" ? "Role" : "Project title"}
                    onCommit={(next) => onUpdateListItem(section.id, item.id, "title", next)}
                  />
                  <InlineEditableField
                    value={item.company}
                    placeholder={section.type === "experience" ? "Company" : "Company / link"}
                    onCommit={(next) => onUpdateListItem(section.id, item.id, "company", next)}
                  />
                  <InlineEditableField
                    value={item.duration}
                    placeholder="Duration"
                    onCommit={(next) => onUpdateListItem(section.id, item.id, "duration", next)}
                  />
                  <InlineEditableField
                    value={item.link}
                    placeholder="Link"
                    onCommit={(next) => onUpdateListItem(section.id, item.id, "link", next)}
                  />
                </div>

                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
                  <InlineEditableField
                    value={item.description}
                    placeholder="Click to add your description"
                    multiline
                    onCommit={(next) => onUpdateListItem(section.id, item.id, "description", next)}
                  />
                  <div className="mt-3">
                    <AISuggestionCard
                      text={item.description}
                      context={section.type === "experience" ? "experience" : "project"}
                      onAccept={(next) => onUpdateListItem(section.id, item.id, "description", next)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveListItem(section.id, item.id);
                    }}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddListItem(section.id);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add {section.type === "experience" ? "experience" : "project"}
            </button>
          </div>
        ) : null}

        {section.type === "skills" ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Skills</p>
            <InlineEditableField
              value={section.content}
              placeholder="Click to add your skills"
              multiline
              onCommit={(next) => onUpdateSectionContent(section.id, next)}
            />
          </div>
        ) : null}

        {section.type === "custom" ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Content</p>
            <InlineEditableField
              value={section.content}
              placeholder="Click to add content"
              multiline
              onCommit={(next) => onUpdateSectionContent(section.id, next)}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
});

export default EditableSection;
