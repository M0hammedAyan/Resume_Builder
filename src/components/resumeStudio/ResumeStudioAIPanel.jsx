import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

function ResumeStudioAIPanel({
  suggestions = [],
  jdDraft = "",
  onJdDraftChange,
  onOpenRecruiterLens,
  resumeReady = false,
}) {
  return (
    <Card className="sticky top-6 hidden h-[calc(100vh-3rem)] overflow-y-auto border-slate-200/80 bg-white/90 p-4 lg:block">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge>AI tools</Badge>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">Review and optimize</h2>
          <p className="mt-1 text-sm text-slate-500">Run role-match analysis and get targeted improvements.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recruiter lens</p>
          <p className="mt-2 text-sm text-slate-600">Paste a job description and open full analysis.</p>
          <textarea
            value={jdDraft}
            onChange={(event) => onJdDraftChange?.(event.target.value)}
            placeholder="Paste JD here..."
            className="mt-3 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          <Button
            className="mt-3 w-full"
            onClick={onOpenRecruiterLens}
            disabled={!resumeReady}
          >
            Analyze in Recruiter Lens
          </Button>
          {!resumeReady ? <p className="mt-2 text-xs text-amber-700">Save or load a resume first.</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume score</p>
          <p className="mt-2 text-sm text-slate-700">Use Recruiter Lens to generate this score.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggestions</p>
          <div className="mt-3 space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
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
          <p className="mt-2 text-sm text-slate-500">Calculated after JD analysis in Recruiter Lens.</p>
        </div>
      </div>
    </Card>
  );
}

export default ResumeStudioAIPanel;
