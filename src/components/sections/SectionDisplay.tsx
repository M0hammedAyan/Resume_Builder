import type { SectionConfig } from "../../types/section-management";

interface SectionDisplayProps {
  sections: SectionConfig[];
}

export function SectionDisplay({ sections }: SectionDisplayProps) {
  const visibleSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {visibleSections.map((section) => (
        <section key={section.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {section.label}
          </h2>

          {/* Content rendering based on type */}
          {section.type === "bullet" && Array.isArray(section.content) && (
            <ul className="space-y-2">
              {(section.content as string[]).map((item, idx) => (
                <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300">
                  <span className="text-cyan-600 dark:text-cyan-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {section.type === "list" && Array.isArray(section.content) && (
            <div className="flex flex-wrap gap-2">
              {(section.content as string[]).map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {section.type === "text" && typeof section.content === "string" && (
            <p className="text-slate-700 dark:text-slate-300">{section.content}</p>
          )}

          {section.type === "text" && Array.isArray(section.content) && (
            <p className="text-slate-700 dark:text-slate-300">
              {(section.content as string[]).join(" ")}
            </p>
          )}

          {section.type === "table" && Array.isArray(section.content) && (
            <table className="w-full border-collapse">
              <tbody>
                {(section.content as Array<Record<string, string>>).map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-300 dark:border-slate-600">
                    {Object.values(row).map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-3 py-2 text-slate-700 dark:text-slate-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
