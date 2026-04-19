import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

export function Card({ children, className = "" }: PropsWithChildren<CardProps>) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 ${className}`}
    >
      {children}
    </section>
  );
}
