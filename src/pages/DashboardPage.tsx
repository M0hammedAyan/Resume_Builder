import { motion } from "framer-motion";
import type { EventItem, ResumeGenerateResponse } from "../types/app";
import { StatsPanel } from "../components/panels/StatsPanel";
import { Card } from "../components/ui/Card";

interface DashboardPageProps {
  events: EventItem[];
  resumeData: ResumeGenerateResponse | null;
}

export function DashboardPage({ events, resumeData }: DashboardPageProps) {
  const score = resumeData?.evaluation?.overall_score ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-4"
    >
      <StatsPanel eventCount={events.length} bulletsCount={resumeData?.bullets?.length ?? 0} score={score} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-100">Recent Events</h3>
          <div className="mt-3 grid gap-2">
            {events.slice(-4).reverse().map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-sm font-semibold text-slate-100">{event.action}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {event.domain} • {event.impact_metric} {event.impact_improvement}
                </p>
              </article>
            ))}
            {events.length === 0 ? <p className="text-sm text-slate-400">No events yet.</p> : null}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-slate-100">Selection Decisions</h3>
          <div className="mt-3 grid gap-2">
            {resumeData?.explanations?.slice(0, 4).map((item) => (
              <article key={`${item.event_id}-${item.decision}`} className="rounded-xl border border-slate-800 p-3">
                <p className="text-sm font-semibold text-slate-100">Event {item.event_id}</p>
                <p className="text-xs text-slate-400">{item.decision.toUpperCase()}</p>
                <p className="mt-1 text-xs text-slate-300">{item.reason}</p>
              </article>
            ))}
            {!resumeData?.explanations?.length ? (
              <p className="text-sm text-slate-400">Generate a resume to view selection rationale.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
