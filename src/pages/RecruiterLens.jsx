import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getCurrentUser, getResumeById, listResumes } from "../services/api.js";
import { apiService } from "../services/api.ts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function RecruiterLens() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeJson, setResumeJson] = useState(null);
  const [result, setResult] = useState(null);

  const canAnalyze = useMemo(() => Boolean(resumeJson && jobDescription.trim()), [resumeJson, jobDescription]);

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
    if (!canAnalyze) {
      return;
    }

    setAnalyzing(true);
    setErrorMessage("");

    try {
      const response = await apiService.recruiterLensAnalyze({
        resume_data: resumeJson,
        job_description: jobDescription.trim(),
      });
      setResult(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Recruiter lens analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge className="w-fit">Recruiter Lens</Badge>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">ATS and Role Match Review</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate("/resume/studio")}>Back to Studio</Button>
        </div>

        <Card className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading resume from backend...
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">This screen uses the currently saved resume.resume_json from backend storage.</p>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste target job description"
                className="min-h-[180px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <div className="flex gap-2">
                <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing} loading={analyzing}>Run Recruiter Lens</Button>
                <Button variant="ghost" onClick={() => navigate("/insights")}>Go to Insights</Button>
              </div>
            </>
          )}

          {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

          {result ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(Number(result.score ?? 0))}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Missing Skills</p>
                <p className="mt-2 text-sm text-slate-700">{(result.missing_skills ?? []).join(", ") || "None"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Suggestions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(result.suggestions ?? []).map((item) => (
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

export default RecruiterLens;
