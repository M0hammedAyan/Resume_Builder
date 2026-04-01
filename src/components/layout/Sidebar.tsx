import { motion } from "framer-motion";
import type { NavPage } from "../../types/app";

interface SidebarProps {
  active: NavPage;
  onSelect: (page: NavPage) => void;
}

const items: Array<{ id: NavPage; label: string; caption: string }> = [
  { id: "dashboard", label: "Overview", caption: "Pulse and pipeline health" },
  { id: "events", label: "Career Events", caption: "Capture raw achievements" },
  { id: "resume", label: "Resume Studio", caption: "Generate and export versions" },
  { id: "insights", label: "Recruiter Lens", caption: "Simulate recruiter feedback" },
];

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 backdrop-blur">
      <h1 className="px-3 py-2 text-lg font-black tracking-tight text-cyan-300">CareerOS</h1>
      <nav className="mt-2 grid gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`relative rounded-xl px-3 py-2 text-left transition ${
              active === item.id ? "text-slate-50" : "text-slate-300 hover:bg-slate-800/80"
            }`}
          >
            {active === item.id ? (
              <motion.span
                layoutId="activeNav"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20"
              />
            ) : null}
            <span className="relative block text-sm font-semibold">{item.label}</span>
            <span className="relative block text-xs text-slate-400">{item.caption}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
