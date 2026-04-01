import { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import type { EventItem } from "../types/app";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextArea } from "../components/ui/Input";

interface EventsPageProps {
  userId: string;
  events: EventItem[];
  onEventCreated: (event: EventItem) => void;
  onToast: (title: string, message: string, variant?: "success" | "error" | "info") => void;
}

export function EventsPage({ userId, events, onEventCreated, onToast }: EventsPageProps) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateEvent() {
    if (!rawText.trim()) {
      onToast("Missing input", "Paste one concrete achievement first.", "error");
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.createEvent({ user_id: userId, raw_text: rawText.trim() });
      const structured = data.structured_event ?? data;
      const event: EventItem = {
        id: String(structured.id),
        action: structured.action,
        domain: structured.domain,
        impact_metric: structured.impact_metric,
        impact_improvement: structured.impact_improvement,
        role_context: structured.role_context,
        tools: structured.tools,
      };
      onEventCreated(event);
      setRawText("");
      onToast("Event created", "Your achievement is now stored and ready for scoring.", "success");
    } catch {
      onToast("Request failed", "Could not create event. Check backend and retry.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Capture Career Event</h3>
        <p className="mt-1 text-sm text-slate-400">
          Write one impact-focused achievement. The backend extracts structured signal automatically.
        </p>
        <div className="mt-4 grid gap-3">
          <TextArea
            label="Raw achievement"
            placeholder="Example: Improved CI pipeline reliability by reducing flaky tests 42% using pytest markers and stable fixtures."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <Button onClick={handleCreateEvent} loading={loading} className="w-fit">
            Extract and Save Event
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Stored Events</h3>
        <div className="mt-3 grid gap-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-sm font-semibold text-slate-100">{event.action}</p>
              <p className="mt-1 text-xs text-slate-400">
                {event.domain} • {event.impact_metric} {event.impact_improvement}
              </p>
            </article>
          ))}
          {events.length === 0 ? <p className="text-sm text-slate-400">No events captured yet.</p> : null}
        </div>
      </Card>
    </motion.div>
  );
}
