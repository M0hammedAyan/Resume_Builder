import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { getCurrentUser, getResumeById, listResumes } from "../services/api.js";
import { apiService } from "../services/api.ts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getAllTemplates } from "../config/resume.templates";

function ExportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [template, setTemplate] = useState("modern-minimal");
  const [templates, setTemplates] = useState(() => getAllTemplates());

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [currentUser, templateList] = await Promise.all([
          getCurrentUser(),
          apiService.getResumeTemplates().catch(() => []),
        ]);

        if (!active) {
          return;
        }
        setUserId(currentUser.data.id);

        const normalizedTemplates = templateList.length > 0 ? templateList.map((item) => ({ ...item })) : getAllTemplates();
        setTemplates(normalizedTemplates);

        const storedResumeId = globalThis.localStorage?.getItem("activeResumeId") ?? "";
        let resumeRecord = null;

        if (storedResumeId) {
          try {
            const response = await getResumeById(storedResumeId);
            resumeRecord = response.data;
          } catch {
            resumeRecord = null;
          }
        }

        if (!resumeRecord) {
          try {
            const response = await listResumes(currentUser.data.id);
            resumeRecord = response.data?.resumes?.[0] ?? null;
          } catch {
            resumeRecord = null;
          }
        }

        const selected = resumeRecord?.selected_template || normalizedTemplates[0]?.id || "modern-minimal";
        setTemplate(selected);
      } catch {
        if (active) {
          setErrorMessage("Failed to resolve user for export");
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

  const downloadPdf = () => {
    if (!userId) {
      return;
    }
    const url = apiService.getDownloadPdfUrl(userId, template);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadDocx = () => {
    if (!userId) {
      return;
    }
    const url = apiService.getDownloadDocxUrl(userId, template);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.06),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Badge className="w-fit">Export</Badge>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Export Resume from Backend</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Pick a template, then generate PDF or DOCX with the same saved resume data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/templates")}>Template Library</Button>
            <Button variant="secondary" onClick={() => navigate("/insights")}>Back to Insights</Button>
          </div>
        </div>

        <Card className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading export context...
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">Export uses backend generation from your saved resume data. No local static templates are used as data source.</p>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Template</span>
                <select
                  value={template}
                  onChange={(event) => setTemplate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadPdf} disabled={!userId}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <Button variant="secondary" onClick={downloadDocx} disabled={!userId}>
                  <Download className="mr-2 h-4 w-4" /> Download DOCX
                </Button>
              </div>
            </>
          )}

          {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
        </Card>
      </div>
    </div>
  );
}

export default ExportPage;
