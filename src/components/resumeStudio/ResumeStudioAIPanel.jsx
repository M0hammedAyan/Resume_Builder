import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function ResumeStudioAIPanel({ suggestions = [] }) {
  return (
    <Card className="sticky top-6 hidden h-[calc(100vh-3rem)] overflow-y-auto p-4 lg:block">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge>AI tools</Badge>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">Review and optimize</h2>
          <p className="mt-1 text-sm text-slate-500">A calm space for future scoring and recommendations.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume score</p>
          <p className="mt-2 text-sm text-slate-700">Coming soon</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggestions</p>
          <div className="mt-3 space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  {item}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Add more content to generate insights.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Missing skills</p>
          <p className="mt-2 text-sm text-slate-500">Will be inferred later from the job target.</p>
        </div>
      </div>
    </Card>
  );
}

export default ResumeStudioAIPanel;
