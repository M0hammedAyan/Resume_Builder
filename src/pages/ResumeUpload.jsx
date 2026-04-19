import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { uploadResume } from "../services/api.js";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function ResumeUpload({ setResumeJson, setResumeId }) {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isFileValid = useMemo(() => {
    if (!file) return false;
    return allowedTypes.includes(file.type) || /\.(pdf|docx)$/i.test(file.name);
  }, [file]);

  const handleFile = (selected) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!selected) return;

    if (!(allowedTypes.includes(selected.type) || /\.(pdf|docx)$/i.test(selected.name))) {
      setFile(null);
      setErrorMessage("Please upload a PDF or DOCX file");
      return;
    }

    setFile(selected);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    handleFile(dropped);
  };

  const handleUpload = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!file || !isFileValid) {
      setErrorMessage("Please select a valid PDF or DOCX file first");
      return;
    }

    try {
      setLoading(true);
      const response = await uploadResume(file, file.name.replace(/\.[^.]+$/, "") || "Uploaded Resume");
      const data = response.data;
      console.log("Uploaded resume:", data);

      const resumeId = data.resume_id ?? data.id ?? "";

      setResumeJson(data.parse_result ?? data.resume_json ?? null);
      setResumeId(resumeId);

      if (resumeId) {
        globalThis.localStorage?.setItem("activeResumeId", resumeId);
      }

      setSuccessMessage("Upload successful. Opening Resume Studio...");

      window.setTimeout(() => navigate("/resume/studio"), 500);
    } catch (error) {
      const backendMessage = error?.response?.data?.detail;
      setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <Card className="w-full p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <Badge className="w-fit">Import resume</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resume Upload</h1>
            <p className="text-sm text-slate-600">Drag and drop your file or browse from your device. PDF and DOCX are supported.</p>
          </div>

          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragActive ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <UploadCloud className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-800">Drop PDF or DOCX here</p>
            <p className="mt-1 text-xs text-slate-500">Accepted: .pdf, .docx</p>

            <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <FileUp className="mr-2 h-4 w-4" /> Choose file
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {file ? (
              <div className="mx-auto mt-4 max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
                <p className="font-medium text-slate-900">Selected file</p>
                <p className="mt-1 truncate">{file.name}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No file selected yet.</p>
            )}
          </div>

          {errorMessage ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
          {successMessage ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" className="sm:w-40" onClick={() => navigate("/resume")}>Back</Button>
            <Button className="sm:flex-1" onClick={handleUpload} disabled={loading || !isFileValid} loading={loading}>
              Upload and continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ResumeUpload;
