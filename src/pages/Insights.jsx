import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getCurrentUser, getResumeById, listResumes } from "../services/api.js";
import { apiService } from "../services/api.ts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function Insights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resumeJson, setResumeJson] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const currentUser = await getCurrentUser();
        const currentUserId = currentUser.data.id;
        const activeResumeId = globalThis.localStorage?.getItem("activeResumeId") ?? "";

        let resumeRecord = null;

        if (activeResumeId) {
          try {
            const response = await getResumeById(activeResumeId);
            resumeRecord = response.data;
          } catch {
            resumeRecord = null;
          }
        }

        if (!resumeRecord) {
          const response = await listResumes(currentUserId);
          resumeRecord = response.data?.resumes?.[0] ?? null;
        }

        if (!resumeRecord?.resume_json) {
          throw new Error("No saved resume found. Build or upload one first.");
        }

        if (!active) {
          return;
        }

        setResumeJson(resumeRecord.resume_json);
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load resume");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  const handleAnalyze = async () => {
    if (!resumeJson) {
      return;
    }

    setAnalyzing(true);
    setErrorMessage("");

    try {
      const response = await apiService.getInsights({ resume_data: resumeJson, use_llm: true });
      setAnalysis(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to compute insights");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge className="w-fit">Insights</Badge>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Career Insights from Resume JSON</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate("/recruiter-lens")}>Back to Recruiter Lens</Button>
        </div>

        <Card className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading resume from backend...
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">Insights are generated from the persisted resume.resume_json only.</p>
              <div className="flex gap-2">
                <Button onClick={handleAnalyze} disabled={!resumeJson || analyzing} loading={analyzing}>Generate Insights</Button>
                <Button variant="ghost" onClick={() => navigate("/export")}>Go to Export</Button>
              </div>
            </>
          )}

          {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

          {analysis ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Summary</p>
                <p className="mt-2 text-sm text-slate-700">{analysis.summary || "No summary available"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Top Strengths</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(analysis.top_strengths ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommended Next Steps</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(analysis.recommended_actions ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default Insights;
