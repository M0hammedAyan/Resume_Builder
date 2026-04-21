import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 focus-visible:ring-slate-400",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-300",
  ghost: "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 focus-visible:ring-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300",
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
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 outline-none ring-offset-2 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Working...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
