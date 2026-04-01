import type { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "neutral" | "good" | "warn";
  className?: string;
}

const toneClass = {
  neutral: "bg-slate-800 text-slate-200 border-slate-700",
  good: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
  warn: "bg-amber-950/60 text-amber-300 border-amber-700/50",
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
