import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/layout/Sidebar";
import { ChatView } from "./components/ChatView";
import { ResumeStudioView } from "./components/ResumeStudioView";
import { RecruiterLensView } from "./components/RecruiterLensView";
import { TemplateGalleryView } from "./components/TemplateGalleryView";
import { InsightsView } from "./components/InsightsView";
import { useCareerOSStore } from "./store/careeros.store";

function App() {
  const { currentPage } = useCareerOSStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                {currentPage === "chat"
                  ? "Career Chat"
                  : currentPage === "resume"
                    ? "Resume Studio"
                    : currentPage === "recruiter"
                      ? "Recruiter Lens"
                      : currentPage === "templates"
                        ? "Templates"
                        : "Career Insights"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Learn more</span>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {currentPage === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ChatView />
              </motion.div>
            )}

            {currentPage === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ResumeStudioView />
              </motion.div>
            )}

            {currentPage === "recruiter" && (
              <motion.div
                key="recruiter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <RecruiterLensView />
              </motion.div>
            )}

            {currentPage === "templates" && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto"
              >
                <TemplateGalleryView />
              </motion.div>
            )}

            {currentPage === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto"
              >
                <InsightsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
