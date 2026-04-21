import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCurrentUser, getResumeById, listResumes } from "../services/api.js";
import { apiService } from "../services/api.ts";
import AppSidebarNav from "../components/layout/AppSidebarNav";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function Insights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchingInsights, setFetchingInsights] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [insights, setInsights] = useState(null);

  const scoreTrendData = useMemo(
    () =>
      (insights?.score_history ?? []).map((score, index) => ({
        version: `V${index + 1}`,
        score,
      })),
    [insights],
  );

  const skillCoverageData = useMemo(
    () => [
      { name: "Matched", value: Number(insights?.skill_coverage?.matched ?? 0), color: "#0ea5e9" },
      { name: "Missing", value: Number(insights?.skill_coverage?.missing ?? 0), color: "#ef4444" },
    ],
    [insights],
  );

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

        setResumeId(String(resumeRecord.id ?? ""));
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

  const handleFetchInsights = async () => {
    if (!resumeId) {
      return;
    }

    setFetchingInsights(true);
    setErrorMessage("");

    try {
      const response = await apiService.getInsightsDashboard(resumeId);
      setInsights(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load insights dashboard");
    } finally {
      setFetchingInsights(false);
    }
  };

  useEffect(() => {
    if (!resumeId) {
      return;
    }
    handleFetchInsights();
  }, [resumeId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.07),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 sm:py-10">
      <AppSidebarNav />
      <div className="mx-auto max-w-5xl space-y-4 lg:pl-64">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Badge className="w-fit">Insights</Badge>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Career Insights from Resume JSON</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Softer charts, clearer hierarchy, same data source.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/recruiter-lens")}>Back to Recruiter Lens</Button>
        </div>

        <Card className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading resume from backend...
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">Live dashboard built from recruiter analyses, resume versions, and current resume JSON.</p>
              <div className="flex gap-2">
                <Button onClick={handleFetchInsights} disabled={!resumeId || fetchingInsights} loading={fetchingInsights}>
                  {fetchingInsights ? "Refreshing..." : "Refresh Insights"}
                </Button>
                <Button variant="ghost" onClick={() => navigate("/export")}>Go to Export</Button>
              </div>
            </>
          )}

          {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

          {!insights && !loading && !fetchingInsights ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600">
              Run Recruiter Lens analysis first, then refresh insights to see what to improve next.
            </div>
          ) : null}

          {insights ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score Overview</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-4xl font-bold text-slate-900">{Math.round(Number(insights.latest_score ?? 0))}%</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{insights.resume_strength}</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round(Number(insights.latest_score ?? 0))))}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score Trend</p>
                  <div className="mt-3 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="version" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Skill Coverage</p>
                  <div className="mt-3 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={skillCoverageData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                          {skillCoverageData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-600">
                    <span>Matched: {Number(insights.skill_coverage?.matched ?? 0)}</span>
                    <span>Missing: {Number(insights.skill_coverage?.missing ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Top Missing Skills</p>
                {Array.isArray(insights.top_missing_skills) && insights.top_missing_skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {insights.top_missing_skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">No critical missing skills right now.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Improvement Areas</p>
                {Array.isArray(insights.improvement_areas) && insights.improvement_areas.length > 0 ? (
                  <div className="mt-3 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={insights.improvement_areas.map((area) => ({ area, priority: 1 }))}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" hide domain={[0, 1]} />
                        <YAxis type="category" dataKey="area" width={120} />
                        <Tooltip formatter={() => "Focus"} />
                        <Bar dataKey="priority" fill="#f59e0b" radius={[4, 4, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">No weak areas detected in the latest cycle.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommendations</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(insights.recommendations ?? []).map((item) => (
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
