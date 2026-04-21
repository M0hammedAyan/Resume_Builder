import { motion } from "framer-motion";
import { MessageSquare, FileText, Eye, LayoutTemplate, LineChart } from "lucide-react";
import { useCareerOSStore } from "../../store/careeros.store";

const items: Array<{
  id: "chat" | "resume" | "recruiter" | "templates" | "insights";
  label: string;
  caption: string;
  icon: React.ReactNode;
}> = [
  {
    id: "chat",
    label: "Chat",
    caption: "Describe your updates",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: "resume",
    label: "Resume Studio",
    caption: "Design & export",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "recruiter",
    label: "Recruiter Lens",
    caption: "Job matching",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "templates",
    label: "Templates",
    caption: "Browse layouts",
    icon: <LayoutTemplate className="h-4 w-4" />,
  },
  {
    id: "insights",
    label: "Insights",
    caption: "Growth metrics",
    icon: <LineChart className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage } = useCareerOSStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-black tracking-tight text-slate-950">
          <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Career
          </span>
          <span className="text-slate-950">OS</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">Build your best resume</p>
      </motion.div>

      <nav className="space-y-2">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative w-full rounded-2xl px-4 py-3 text-left transition duration-200 ${
              currentPage === item.id
                ? "border border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            {currentPage === item.id && (
              <motion.span
                layoutId="activeNav"
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
              />
            )}
            <div className="relative flex items-center gap-3">
              <div
                className={`transition ${
                  currentPage === item.id
                    ? "text-white"
                    : "text-slate-400"
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={`text-xs ${currentPage === item.id ? "text-white/65" : "text-slate-500"}`}>{item.caption}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </nav>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-4 left-4 right-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold text-slate-900">Tip</p>
          <p className="mt-1 text-xs text-slate-500">
            Chat first, then refine in Studio
          </p>
        </div>
      </motion.div>
    </aside>
  );
}
