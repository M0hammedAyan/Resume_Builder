import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { ToastStack } from "./components/ui/ToastStack";
import { useToast } from "./hooks/useToast";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { ResumeStudioPage } from "./pages/ResumeStudioPageNew";
import { RecruiterLensPage } from "./pages/RecruiterLensPage";
import type { EventItem, NavPage, ResumeGenerateResponse } from "./types/app";

function App() {
  const [page, setPage] = useState<NavPage>("dashboard");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [resumeData, setResumeData] = useState<ResumeGenerateResponse | null>(null);
  const [userId, setUserId] = useState("00000000-0000-0000-0000-000000000001");
  const { toasts, push, dismiss } = useToast();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
    [],
  );

  function showToast(title: string, message: string, variant?: "success" | "error" | "info") {
    push({ title, message, variant });
  }

  return (
    <div className="min-h-screen bg-aurora px-3 py-4 text-slate-100 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <Sidebar active={page} onSelect={setPage} />
        <main className="grid gap-4">
          <TopBar userId={userId} apiBase={apiBase} />
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur md:p-5">
            <div className="mb-4 max-w-xs">
              <label className="text-xs uppercase tracking-widest text-slate-400">Active user id</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm"
              />
            </div>

            <AnimatePresence mode="wait">
              {page === "dashboard" ? (
                <DashboardPage key="dashboard" events={events} resumeData={resumeData} />
              ) : null}
              {page === "events" ? (
                <EventsPage
                  key="events"
                  userId={userId}
                  events={events}
                  onEventCreated={(event) => setEvents((prev) => [...prev, event])}
                  onToast={showToast}
                />
              ) : null}
              {page === "resume" ? (
                <ResumeStudioPage
                  key="resume"
                  userId={userId}
                  onToast={showToast}
                />
              ) : null}
              {page === "insights" ? (
                <RecruiterLensPage key="insights" userId={userId} resumeData={resumeData} onToast={showToast} />
              ) : null}
            </AnimatePresence>
          </section>
        </main>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;
