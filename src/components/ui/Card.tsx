import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

export function Card({ children, className = "" }: PropsWithChildren<CardProps>) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/40 backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}
