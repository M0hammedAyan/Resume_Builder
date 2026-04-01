import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-105",
  secondary:
    "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700",
  ghost: "bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800/60",
  danger: "bg-rose-600 text-rose-50 hover:bg-rose-500",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  loading,
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? "Working..." : children}
    </motion.button>
  );
}
