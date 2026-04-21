import type { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "neutral" | "good" | "warn";
  className?: string;
}

const toneClass = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
};

export function Badge({ children, tone = "neutral", className = "" }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
