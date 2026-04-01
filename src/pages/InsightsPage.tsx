import { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import type {
  CareerInsights,
  JobMatchResult,
  RecruiterResult,
  ResumeGenerateResponse,
  ResumeVersion,
  ResumeVersionCompare,
  SkillGapResult,
} from "../types/app";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextArea } from "../components/ui/Input";

interface InsightsPageProps {
  userId: string;
  resumeData: ResumeGenerateResponse | null;
  onToast: (title: string, message: string, variant?: "success" | "error" | "info") => void;
}

export function InsightsPage({ userId, resumeData, onToast }: InsightsPageProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [recruiterResult, setRecruiterResult] = useState<RecruiterResult | null>(null);
  const [insights, setInsights] = useState<CareerInsights | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatchResult | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [compareResult, setCompareResult] = useState<ResumeVersionCompare | null>(null);
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [loading, setLoading] = useState(false);

  async function runRecruiterSimulation() {
    const resumeText = resumeData?.bullets?.join("\n") ?? "";
    if (!resumeText) {
      onToast("No resume content", "Generate resume bullets first.", "error");
      return;
    }
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a JD for recruiter simulation.", "error");
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.recruiterSimulate({
        resume_text: resumeText,
        job_description: jobDescription,
        use_llm: false,
      });
      setRecruiterResult(data);
      onToast("Simulation completed", "Recruiter view generated.", "success");
    } catch {
      onToast("Simulation failed", "Could not complete recruiter analysis.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function runCareerInsights() {
    try {
      const data = await apiService.getInsights(userId);
      setInsights(data);
    } catch {
      onToast("Insights failed", "Could not load career insights.", "error");
    }
  }

  async function runJobMatch() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a JD first.", "error");
      return;
    }
    try {
      const data = await apiService.jobMatch({ user_id: userId, job_description: jobDescription });
      setJobMatch(data);
      const gap = await apiService.getSkillGap(userId, jobDescription);
      setSkillGap(gap);
    } catch {
      onToast("Job match failed", "Could not run job match engine.", "error");
    }
  }

  async function loadVersions() {
    try {
      const data = await apiService.getResumeVersions(userId);
      setVersions(data);
      if (data.length >= 2) {
        setVersionA(data[1].id);
        setVersionB(data[0].id);
      }
    } catch {
      onToast("Version load failed", "Could not load resume versions.", "error");
    }
  }

  async function compareVersions() {
    if (!versionA || !versionB) {
      onToast("Missing versions", "Select two versions first.", "error");
      return;
    }
    try {
      const data = await apiService.compareResumeVersions(versionA, versionB);
      setCompareResult(data);
    } catch {
      onToast("Compare failed", "Could not compare selected versions.", "error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Career Insights Engine</h3>
        <div className="mt-3 flex gap-2">
          <Button onClick={runCareerInsights}>Analyze Growth</Button>
          <Button variant="ghost" onClick={loadVersions}>
            Load Resume Versions
          </Button>
        </div>

        {insights ? (
          <div className="mt-4 grid gap-2 text-sm text-slate-200">
            <p>
              Growth trend: <span className="font-semibold text-cyan-300">{insights.growth_trend}</span>
            </p>
            <p>Strengths: {insights.strength_areas.join(", ") || "None"}</p>
            <p>Weak areas: {insights.weak_areas.join(", ") || "None"}</p>
            <ul className="list-disc pl-5">
              {insights.recommendations.map((item, index) => (
                <li key={`rec-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Job Match + Skill Gap Engine</h3>
        <div className="mt-4 grid gap-3">
          <TextArea
            label="Target job description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste JD to compare against your generated resume bullets"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={runJobMatch}>Run Match</Button>
            <Button onClick={runRecruiterSimulation} loading={loading} className="w-fit">
            Run Simulation
            </Button>
          </div>

          {jobMatch ? (
            <div className="rounded-xl border border-slate-800 p-3 text-sm">
              <p>
                Match score: <span className="font-semibold text-emerald-300">{jobMatch.match_score}%</span>
              </p>
              <p className="mt-1">Matched skills: {jobMatch.matched_skills.join(", ") || "None"}</p>
              <p className="mt-1">Missing skills: {jobMatch.missing_skills.join(", ") || "None"}</p>
            </div>
          ) : null}

          {skillGap ? (
            <div className="rounded-xl border border-slate-800 p-3 text-sm">
              <p className="mb-1 font-semibold text-slate-100">Priority Skill Gaps</p>
              <ul className="grid gap-1">
                {skillGap.priority_ranking.slice(0, 5).map((item) => (
                  <li key={item.skill}>
                    P{item.priority}: {item.skill} ({item.reason})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Recruiter Feedback</h3>
        {recruiterResult ? (
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-slate-300">
              Recruiter fit score: <span className="font-bold text-emerald-300">{Math.round(recruiterResult.score * 100)}%</span>
            </p>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Strengths</p>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-slate-200">
                {recruiterResult.strengths.map((item, i) => (
                  <li key={`s-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Weaknesses</p>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-slate-200">
                {recruiterResult.weaknesses.map((item, i) => (
                  <li key={`w-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Suggestions</p>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-slate-200">
                {recruiterResult.suggestions.map((item, i) => (
                  <li key={`g-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No simulation yet.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Resume Versioning</h3>
        <div className="mt-3 grid gap-2 text-sm">
          <p>Versions loaded: {versions.length}</p>
          <select value={versionA} onChange={(e) => setVersionA(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
            <option value="">Select version A</option>
            {versions.map((item) => (
              <option key={`a-${item.id}`} value={item.id}>
                {new Date(item.created_at).toLocaleString()} | ATS {item.ats_score}
              </option>
            ))}
          </select>
          <select value={versionB} onChange={(e) => setVersionB(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
            <option value="">Select version B</option>
            {versions.map((item) => (
              <option key={`b-${item.id}`} value={item.id}>
                {new Date(item.created_at).toLocaleString()} | ATS {item.ats_score}
              </option>
            ))}
          </select>
          <Button onClick={compareVersions}>Compare Versions</Button>

          {compareResult ? (
            <div className="rounded-xl border border-slate-800 p-3">
              <p>
                Score delta: <span className="font-semibold text-cyan-300">{compareResult.score_delta}</span>
              </p>
              <p className="mt-1">Added bullets: {compareResult.added_bullets.length}</p>
              <p>Removed bullets: {compareResult.removed_bullets.length}</p>
              <p>Common bullets: {compareResult.common_bullets.length}</p>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
