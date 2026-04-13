import { motion } from "framer-motion";
import { MessageSquare, FileText, Eye, BookOpen, Lightbulb } from "lucide-react";
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
    caption: "Browse designs",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: "insights",
    label: "Insights",
    caption: "Career analysis",
    icon: <Lightbulb className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage } = useCareerOSStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur p-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black tracking-tighter">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Career
          </span>
          <span className="text-slate-100">OS</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">Build your best resume</p>
      </motion.div>

      {/* Navigation */}
      <nav className="space-y-2">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative w-full rounded-xl px-4 py-3 text-left transition duration-150 ${
              currentPage === item.id
                ? "text-slate-50"
                : "text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            {currentPage === item.id && (
              <motion.span
                layoutId="activeNav"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-purple-500/20"
              />
            )}
            <div className="relative flex items-center gap-3">
              <div
                className={`transition ${
                  currentPage === item.id
                    ? "text-cyan-400"
                    : "text-slate-500"
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.caption}</p>
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
        <div className="rounded-lg border border-slate-800/50 bg-slate-900/50 p-3 text-center">
          <p className="text-xs font-medium text-cyan-400">💡 Tip</p>
          <p className="mt-1 text-xs text-slate-400">
            Chat first, then refine in Studio
          </p>
        </div>
      </motion.div>
    </aside>
  );
}
