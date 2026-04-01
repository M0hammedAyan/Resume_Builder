import { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import type {
  JobMatchResult,
  SkillGapResult,
  RecruiterResult,
  ResumeGenerateResponse,
} from "../types/app";
import type { JDEligibilityResult } from "../types/resume";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextArea, Input } from "../components/ui/Input";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface RecruiterLensPageProps {
  userId: string;
  resumeData: ResumeGenerateResponse | null;
  onToast: (title: string, message: string, variant?: "success" | "error" | "info") => void;
}

export function RecruiterLensPage({
  userId,
  resumeData,
  onToast,
}: RecruiterLensPageProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [eligibility, setEligibility] = useState<JDEligibilityResult | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [jobMatch, setJobMatch] = useState<JobMatchResult | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);
  const [recruiterView, setRecruiterView] = useState<RecruiterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [k, setK] = useState("6");
  const [template, setTemplate] = useState("modern-clean");

  async function checkEligibility() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a job description first.", "error");
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.analyzeJDEligibility({
        userId,
        jobDescription,
      });
      setEligibility(result);
      onToast("Eligibility checked", `Score: ${result.eligibilityScore}%`, "success");
    } catch {
      onToast("Eligibility check failed", "Could not analyze JD.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function getImprovementFeedback() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a job description first.", "error");
      return;
    }

    try {
      setLoading(true);
      const feedbackList = await apiService.getJDFeedback(userId, jobDescription);
      setFeedback(feedbackList);
      onToast("Feedback generated", `${feedbackList.length} recommendations`, "success");
    } catch {
      onToast("Feedback failed", "Could not generate feedback.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function runJobMatch() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a job description first.", "error");
      return;
    }
    try {
      setLoading(true);
      const matchResult = await apiService.jobMatch({
        user_id: userId,
        job_description: jobDescription,
      });
      setJobMatch(matchResult);

      const gapResult = await apiService.getSkillGap(userId, jobDescription);
      setSkillGap(gapResult);

      onToast("Match analysis complete", `Match score: ${matchResult.match_score}%`, "success");
    } catch {
      onToast("Job match failed", "Could not run analysis.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function getRecruiterView() {
    if (!resumeData?.bullets?.length) {
      onToast("No resume content", "Generate resume first.", "error");
      return;
    }
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a job description first.", "error");
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.recruiterSimulate({
        resume_text: resumeData.bullets.join("\n"),
        job_description: jobDescription,
        use_llm: false,
      });
      setRecruiterView(result);
      onToast(
        "Recruiter view generated",
        `Score: ${result.score}/100`,
        "success"
      );
    } catch {
      onToast("Recruiter simulation failed", "Could not generate view.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function generateTargetedResume() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste a job description first.", "error");
      return;
    }

    try {
      setLoading(true);
      // This would use the existing generateResume endpoint
      // For now, we can show a message
      onToast(
        "Feature available",
        "Generate resume for this JD using Resume Studio.",
        "info"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 lg:grid-cols-3"
    >
      {/* JD Input */}
      <Card className="lg:col-span-1">
        <h3 className="text-lg font-semibold text-slate-100">Paste Job Description</h3>
        <div className="mt-4 grid gap-3">
          <TextArea
            label="Job description"
            placeholder="Paste the full job description here to analyze your fit..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkEligibility} loading={loading} size="sm">
              Check Fit
            </Button>
            <Button onClick={getImprovementFeedback} loading={loading} size="sm" variant="secondary">
              Get Feedback
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={runJobMatch} loading={loading} size="sm" variant="ghost">
              Match Skills
            </Button>
            <Button onClick={getRecruiterView} loading={loading} size="sm" variant="ghost">
              Recruiter View
            </Button>
          </div>
        </div>
      </Card>

      {/* Eligibility & Feedback */}
      <div className="lg:col-span-2 grid gap-4">
        {/* Eligibility Score */}
        {eligibility ? (
          <Card>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Your Eligibility</h3>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-cyan-400">
                  {Math.round(eligibility.eligibilityScore)}%
                </span>
                {eligibility.eligibilityScore >= 70 ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-400" />
                )}
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-300">{eligibility.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-400">Matched Skills</p>
                <ul className="mt-2 space-y-1">
                  {eligibility.matchedSkills.slice(0, 4).map((skill, i) => (
                    <li key={i} className="text-xs text-slate-200">
                      ✓ {skill}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Missing Skills</p>
                <ul className="mt-2 space-y-1">
                  {eligibility.missingSkills.slice(0, 4).map((skill, i) => (
                    <li key={i} className="text-xs text-slate-200">
                      ✗ {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Improvement Feedback */}
        {feedback.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-100">Improvement Recommendations</h3>
            <div className="mt-3 space-y-2">
              {feedback.map((item, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-slate-800/50 p-3 text-sm">
                  <span className="text-blue-400">→</span>
                  <span className="text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Job Match Results */}
        {jobMatch && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-100">Job Match Analysis</h3>
            
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                <span className="text-sm text-slate-300">Overall Match Score</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {Math.round(jobMatch.match_score)}%
                </span>
              </div>

              {skillGap && (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {jobMatch.matched_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Missing Skills (Priority)</p>
                    <div className="space-y-2">
                      {skillGap.priority_ranking.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs text-slate-300">
                          <div className="flex justify-between">
                            <span>{item.skill}</span>
                            <span className="text-yellow-400">Priority: {item.priority}</span>
                          </div>
                          <p className="text-slate-400 mt-1">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Recommended Actions</p>
                <ul className="space-y-1">
                  {jobMatch.recommended_actions.map((action, i) => (
                    <li key={i} className="text-xs text-slate-200">
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Recruiter View */}
        {recruiterView && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-100">
              Recruiter Perspective
            </h3>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                <span className="text-sm text-slate-300">Recruiter Rating</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {Math.round(recruiterView.score)}/100
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Strengths</p>
                <ul className="space-y-1">
                  {recruiterView.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-green-300">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Weaknesses</p>
                <ul className="space-y-1">
                  {recruiterView.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-red-300">
                      ✗ {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Suggestions</p>
                <ul className="space-y-1">
                  {recruiterView.suggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-yellow-300">
                      → {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
