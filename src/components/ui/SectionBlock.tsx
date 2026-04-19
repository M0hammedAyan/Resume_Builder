import type { PropsWithChildren, ReactNode } from "react";

interface SectionBlockProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionBlock({ title, description, action, className = "", children }: PropsWithChildren<SectionBlockProps>) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
