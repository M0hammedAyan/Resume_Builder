import { AnimatePresence, motion } from "framer-motion";
import type { ToastItem } from "../../types/app";

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const tone = {
  success: "border-emerald-700/50 bg-emerald-950/70",
  error: "border-rose-700/50 bg-rose-950/70",
  info: "border-slate-700 bg-slate-900/90",
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 grid gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto w-80 rounded-xl border p-3 text-left text-sm text-slate-100 shadow-xl ${tone[toast.variant ?? "info"]}`}
          >
            <p className="font-semibold">{toast.title}</p>
            <p className="mt-1 text-slate-300">{toast.message}</p>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
