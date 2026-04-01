import { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/api";
import type { ResumeGenerateResponse } from "../types/app";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, TextArea } from "../components/ui/Input";

interface ResumeStudioPageProps {
  userId: string;
  resumeData: ResumeGenerateResponse | null;
  onGenerated: (data: ResumeGenerateResponse) => void;
  onToast: (title: string, message: string, variant?: "success" | "error" | "info") => void;
}

export function ResumeStudioPage({ userId, resumeData, onGenerated, onToast }: ResumeStudioPageProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [k, setK] = useState("6");
  const [template, setTemplate] = useState("modern-clean");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!jobDescription.trim()) {
      onToast("Missing job description", "Paste the target role description first.", "error");
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.generateResume({
        user_id: userId,
        job_description: jobDescription,
        k: Number(k) || 6,
      });
      onGenerated(data);
      onToast("Resume generated", "Bullets, ranking, and evaluation are ready.", "success");
    } catch {
      onToast("Generation failed", "Backend could not generate resume output.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Generate Targeted Resume</h3>
        <div className="mt-4 grid gap-3">
          <TextArea
            label="Job description"
            placeholder="Paste full JD to drive retrieval and scoring..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Input label="Top-k events" value={k} onChange={(e) => setK(e.target.value)} />
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-200">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
            >
              <option value="modern-clean">Modern Clean</option>
              <option value="ats-minimal">ATS Minimal</option>
              <option value="technical-profile">Technical Profile</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} loading={loading}>
              Generate Resume
            </Button>
            <a href={apiService.getDownloadPdfUrl(userId, template)} target="_blank" rel="noreferrer">
              <Button variant="secondary">Download PDF</Button>
            </a>
            <a href={apiService.getDownloadDocxUrl(userId, template)} target="_blank" rel="noreferrer">
              <Button variant="ghost">Download DOCX</Button>
            </a>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-100">Generated Bullets</h3>
        <div className="mt-3 grid gap-2">
          {resumeData?.bullets?.map((bullet, idx) => (
            <article key={`${idx}-${bullet.slice(0, 10)}`} className="rounded-xl border border-slate-800 p-3">
              <p className="text-sm text-slate-100">{bullet}</p>
              <div className="mt-2 border-t border-slate-800 pt-2 text-xs text-slate-300">
                {(() => {
                  const selectedEventId = resumeData.selected_events[idx]?.id;
                  const explanation = resumeData.explanations.find((item) => item.event_id === selectedEventId);
                  const breakdown = explanation?.score_breakdown;

                  if (!explanation || !breakdown) {
                    return <p>No explainability metadata available for this bullet.</p>;
                  }

                  return (
                    <>
                      <p>Why selected: {explanation.reason}</p>
                      <p>
                        Score breakdown: relevance {Number(breakdown.relevance ?? 0).toFixed(2)}, impact {Number(breakdown.impact ?? 0).toFixed(2)}, recency {Number(breakdown.recency ?? 0).toFixed(2)}, confidence {Number(breakdown.confidence ?? 0).toFixed(2)}
                      </p>
                    </>
                  );
                })()}
              </div>
            </article>
          ))}
          {!resumeData?.bullets?.length ? (
            <p className="text-sm text-slate-400">No bullets yet. Generate from a target job description.</p>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
