import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

interface StatsPanelProps {
  eventCount: number;
  bulletsCount: number;
  score: number;
}

export function StatsPanel({ eventCount, bulletsCount, score }: StatsPanelProps) {
  const rounded = Math.round(score * 100);

  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Events Captured</p>
          <p className="mt-1 text-3xl font-black text-cyan-300">{eventCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Bullets Generated</p>
          <p className="mt-1 text-3xl font-black text-indigo-300">{bulletsCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Resume Match Score</p>
          <p className="mt-1 text-3xl font-black text-emerald-300">{rounded}%</p>
          <div className="mt-2">
            <ProgressBar value={rounded} />
          </div>
        </div>
      </div>
    </Card>
  );
}
