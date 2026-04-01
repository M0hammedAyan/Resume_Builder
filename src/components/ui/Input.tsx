import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  hint?: string;
}

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Input({ label, hint, className = "", ...props }: InputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        className={`w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300 transition focus:border-cyan-400 focus:ring-2 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, hint, className = "", ...props }: TextAreaProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <textarea
        className={`min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-300 transition focus:border-cyan-400 focus:ring-2 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
