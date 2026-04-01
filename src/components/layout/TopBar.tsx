import { Badge } from "../ui/Badge";

interface TopBarProps {
  userId: string;
  apiBase: string;
}

export function TopBar({ userId, apiBase }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Personal AI Resume OS</p>
        <h2 className="text-xl font-bold text-slate-100">Craft targeted resumes with measurable impact</h2>
      </div>
      <div className="flex items-center gap-2">
        <Badge>API: {apiBase}</Badge>
        <Badge tone="good">User: {userId}</Badge>
      </div>
    </header>
  );
}
