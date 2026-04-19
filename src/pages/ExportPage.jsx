import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { getCurrentUser } from "../services/api.js";
import { apiService } from "../services/api.ts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function ExportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [template, setTemplate] = useState("ats-minimal");

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const currentUser = await getCurrentUser();
        if (!active) {
          return;
        }
        setUserId(currentUser.data.id);
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
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge className="w-fit">Export</Badge>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Export Resume from Backend</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate("/insights")}>Back to Insights</Button>
        </div>

        <Card className="space-y-3">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                >
                  <option value="ats-minimal">ATS Minimal</option>
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
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
