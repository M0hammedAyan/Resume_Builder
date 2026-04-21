import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, X } from "lucide-react";
import AppSidebarNav from "../components/layout/AppSidebarNav";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import TemplateCard from "../components/templates/TemplateCard";
import { TemplatePreview } from "../components/templates/TemplatePreview";
import { apiService } from "../services/api.ts";
import { createResumeRecord, getCurrentUser, getResumeById, listResumes, updateResume } from "../services/api.js";
import { getAllTemplates } from "../config/resume.templates";

const DEFAULT_RESUME_JSON = {
  personal: {
    name: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    summary: "",
  },
  education: [],
  experience: [],
  skills: [],
  projects: [],
  optional_sections: [],
};

const normalizeTemplate = (template) => {
  const layout = template.layout ?? {};
  const fontFamily = template.fontFamily ?? template.font_family ?? {
    heading: template.font_family_heading ?? "Arial, sans-serif",
    body: template.font_family_body ?? "Arial, sans-serif",
  };
  const fontSize = template.fontSize ?? template.font_size ?? {
    name: template.font_size_name ?? 18,
    title: template.font_size_title ?? template.font_size_section ?? 11,
    section: template.font_size_section ?? 13,
    body: template.font_size_body ?? 10,
  };
  const colors = template.colors ?? {
    text: template.text_color ?? "#0f172a",
    accent: template.accent_color ?? "#0f172a",
    background: template.background_color ?? "#ffffff",
    secondary: template.secondary_color ?? "#475569",
  };

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    fontFamily,
    fontSize: {
      name: fontSize.name ?? 18,
      title: fontSize.title ?? fontSize.section ?? 11,
      section: fontSize.section ?? fontSize.title ?? 13,
      body: fontSize.body ?? 10,
    },
    colors,
    lineHeight: template.lineHeight ?? template.line_height ?? 1.45,
    layout: {
      columns: layout.columns ?? (layout === "two-column" ? 2 : 1),
      headerStyle: layout.headerStyle ?? template.header_style ?? "left",
      sectionBorder: layout.sectionBorder ?? template.section_border ?? false,
      skillsLayout: layout.skillsLayout ?? template.skills_layout ?? "list",
    },
    recommendedFor: template.recommendedFor ?? template.recommended_for ?? [],
  };
};

function TemplatesPage({ resumeJson, setResumeJson, resumeId, setResumeId }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState(() => getAllTemplates().map(normalizeTemplate));
  const [loading, setLoading] = useState(true);
  const [savingTemplateId, setSavingTemplateId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resumeRecord, setResumeRecord] = useState(null);
  const [currentTemplateId, setCurrentTemplateId] = useState("modern-minimal");
  const [previewTemplateId, setPreviewTemplateId] = useState("");
  const [previewResumeJson, setPreviewResumeJson] = useState(DEFAULT_RESUME_JSON);

  const previewTemplate = useMemo(
    () => templates.find((template) => template.id === previewTemplateId) ?? templates[0] ?? normalizeTemplate(getAllTemplates()[0]),
    [previewTemplateId, templates],
  );

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

        const normalizedTemplates = (templateList.length > 0 ? templateList : getAllTemplates()).map(normalizeTemplate);
        setTemplates(normalizedTemplates);

        const currentUserId = currentUser.data.id;
        const storedResumeId = resumeId || globalThis.localStorage?.getItem("activeResumeId") || "";
        let record = null;

        if (storedResumeId) {
          try {
            const response = await getResumeById(storedResumeId);
            record = response.data;
          } catch {
            record = null;
          }
        }

        if (!record) {
          try {
            const response = await listResumes(currentUserId);
            record = response.data?.resumes?.[0] ?? null;
          } catch {
            record = null;
          }
        }

        if (!record) {
          const created = await createResumeRecord({
            userId: currentUserId,
            title: "Resume",
            summary: "",
            resumeJson: DEFAULT_RESUME_JSON,
          });
          record = created.data;
        }

        const nextTemplateId = record?.selected_template || normalizedTemplates[0]?.id || "modern-minimal";
        const nextResumeJson = record?.resume_json ?? resumeJson ?? DEFAULT_RESUME_JSON;

        setResumeRecord(record);
        setCurrentTemplateId(nextTemplateId);
        setPreviewResumeJson(nextResumeJson);
        setPreviewTemplateId(nextTemplateId);
        setResumeId?.(record?.id ?? "");
        setResumeJson?.(nextResumeJson);
        if (record?.id) {
          globalThis.localStorage?.setItem("activeResumeId", record.id);
        }
        globalThis.localStorage?.setItem("resumeSelectedTemplate", nextTemplateId);
      } catch {
        if (active) {
          setErrorMessage("Failed to load template library");
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
  }, [resumeId, setResumeId, setResumeJson]);

  const handleUseTemplate = async (templateId) => {
    if (!resumeRecord || savingTemplateId) {
      return;
    }

    setSavingTemplateId(templateId);
    setErrorMessage("");

    try {
      const response = await updateResume({
        resume_id: resumeRecord.id,
        title: resumeRecord.title,
        summary: resumeRecord.summary,
        status: resumeRecord.status,
        resume_json: resumeRecord.resume_json ?? previewResumeJson,
        selected_template: templateId,
      });

      const updated = response.data;
      const nextTemplateId = updated?.selected_template || templateId;
      setResumeRecord(updated);
      setCurrentTemplateId(nextTemplateId);
      setPreviewResumeJson(updated?.resume_json ?? previewResumeJson);
      setResumeJson?.(updated?.resume_json ?? previewResumeJson);
      setResumeId?.(updated?.id ?? resumeRecord.id);
      if (updated?.id || resumeRecord.id) {
        globalThis.localStorage?.setItem("activeResumeId", updated?.id ?? resumeRecord.id);
      }
      globalThis.localStorage?.setItem("resumeSelectedTemplate", nextTemplateId);
      navigate("/resume/studio");
    } catch {
      setErrorMessage("Unable to save template selection. Please try again.");
    } finally {
      setSavingTemplateId("");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <AppSidebarNav />
      <div className="mx-auto max-w-7xl space-y-6 lg:pl-64">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge className="w-fit">Template Library</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Choose a resume template</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Every template uses the same resume_json structure. Only the layout, typography, and spacing change.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/resume/studio") }>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
            </Button>
          </div>
        </div>

        {errorMessage ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

        {loading ? (
          <Card className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">Loading template library...</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                resumeJson={previewResumeJson}
                isSelected={template.id === currentTemplateId}
                onPreview={setPreviewTemplateId}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {previewTemplateId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl">
            <button
              type="button"
              onClick={() => setPreviewTemplateId("")}
              className="absolute right-3 top-3 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-lg transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
            <Card className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge className="w-fit">Preview</Badge>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{previewTemplate.name}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{previewTemplate.description}</p>
                </div>
                <Button
                  loading={Boolean(savingTemplateId)}
                  disabled={Boolean(savingTemplateId)}
                  onClick={() => handleUseTemplate(previewTemplate.id)}
                >
                  Use Template
                </Button>
              </div>
              <div className="mx-auto max-w-5xl">
                <TemplatePreview template={previewTemplate} resumeJson={previewResumeJson} mode="full" />
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TemplatesPage;
