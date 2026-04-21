import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

export function Card({ children, className = "" }: PropsWithChildren<CardProps>) {
  return (
    <section
      className={`premium-card premium-hover rounded-2xl border border-slate-200 bg-white p-5 ${className}`}
    >
      {children}
    </section>
  );
}
