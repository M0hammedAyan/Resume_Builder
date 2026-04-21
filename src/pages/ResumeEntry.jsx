import { useNavigate } from "react-router-dom";
import { FilePlus2, UploadCloud } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

function ResumeEntry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.06),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-5xl p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-3 text-center">
            <Badge className="mx-auto">Resume workflow</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Choose how you want to start</h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              Build a resume from scratch or upload an existing file to continue editing in Resume Studio.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-slate-300 hover:bg-white">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FilePlus2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Build Resume</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create a structured resume with guided sections, dynamic entries, and AI rewrite assistance.</p>
              <Button className="mt-6 w-full" onClick={() => navigate("/resume/build")}>Start building</Button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-slate-300 hover:bg-white">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Upload Resume</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Import a PDF or DOCX and continue editing in the studio without re-entering your content.</p>
              <Button variant="secondary" className="mt-6 w-full" onClick={() => navigate("/resume/upload")}>Upload file</Button>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ResumeEntry;
