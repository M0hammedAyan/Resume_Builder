import { motion } from "framer-motion";
import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useCareerOSStore } from "../store/careeros.store";
import { ResumeFileUpload } from "./ResumeFileUpload";
import { apiService } from "../services/api";
import type { ResumeSectionData } from "../types/resume";
import { parseResumeFileLocally } from "../utils/localResumeParser";
import { getAllTemplates, render_template, type TemplateId } from "../config/resume.templates";
import { mapStoreResumeToTemplateData } from "../utils/templateResumeMapper";
import { RichDocumentEditor } from "./editor/RichDocumentEditor";

export function ResumeStudioView() {
  const { resume, selectedTemplate, setSelectedTemplate, setResume } = useCareerOSStore();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const templates = getAllTemplates();

  const templateData = useMemo(
    () => mapStoreResumeToTemplateData(resume as NonNullable<typeof resume>) as unknown as Record<string, unknown>,
    [resume],
  );
  const renderedHtml = useMemo(
    () => render_template(selectedTemplate as TemplateId, templateData),
    [selectedTemplate, templateData],
  );
  const selectedTemplateStyle = useMemo(
    () => templates.find((template) => template.id === selectedTemplate),
    [selectedTemplate, templates],
  );

  function getSectionTemplate(type: "experience" | "projects" | "skills" | "education" | "achievements") {
    switch (type) {
      case "skills":
        return "Skills\n- ";
      case "experience":
        return "Experience\nCompany Name - Role\n• ";
      case "education":
        return "Education\nDegree - University\n";
      case "projects":
        return "Projects\nProject Name\n• ";
      case "achievements":
        return "Achievements\n• ";
      default:
        return `${type}\n`;
    }
  }

  function addSectionTemplate(type: "experience" | "projects" | "skills" | "education" | "achievements") {
    console.log("Insert section:", type);
    if (!editorInstance) return;

    editorInstance
      .chain()
      .focus()
      .insertContent({
        type: "paragraph",
        content: [{ type: "text", text: getSectionTemplate(type) }],
      })
      .run();
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setUploadError(undefined);
    setUploadSuccess(false);

    try {
      const userId = "00000000-0000-0000-0000-000000000001";
      const uploadResult = await apiService.uploadResumeFile(userId, file);
      const parsed = uploadResult.parseResult;

      const mkBullets = (
        section: "experience" | "projects" | "skills" | "education" | "achievements",
        items: string[],
      ) =>
        items.map((content, index) => ({
          id: `${section}-${index}-${Date.now()}`,
          section,
          content,
          createdAt: new Date().toISOString(),
        }));

      const sections: ResumeSectionData[] = [
        { section: "experience", title: "Experience", bullets: mkBullets("experience", parsed.experience ?? []) },
        { section: "projects", title: "Projects", bullets: mkBullets("projects", parsed.projects ?? []) },
        { section: "skills", title: "Skills", bullets: mkBullets("skills", parsed.skills ?? []) },
        { section: "education", title: "Education", bullets: mkBullets("education", parsed.education ?? []) },
        { section: "achievements", title: "Achievements", bullets: [] },
      ];

      setResume({
        id: uploadResult.resumeId || `uploaded-${Date.now()}`,
        header: {
          name: parsed.name || "Uploaded Candidate",
          title: "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: "",
        },
        summary: parsed.summary || "",
        sections,
      });

      setUploadSuccess(true);
    } catch (error) {
      try {
        const parsed = await parseResumeFileLocally(file);

        const mkBullets = (
          section: "experience" | "projects" | "skills" | "education" | "achievements",
          items: string[],
        ) =>
          items.map((content, index) => ({
            id: `${section}-${index}-${Date.now()}`,
            section,
            content,
            createdAt: new Date().toISOString(),
          }));

        const sections: ResumeSectionData[] = [
          { section: "experience", title: "Experience", bullets: mkBullets("experience", parsed.experience ?? []) },
          { section: "projects", title: "Projects", bullets: mkBullets("projects", parsed.projects ?? []) },
          { section: "skills", title: "Skills", bullets: mkBullets("skills", parsed.skills ?? []) },
          { section: "education", title: "Education", bullets: mkBullets("education", parsed.education ?? []) },
          { section: "achievements", title: "Achievements", bullets: [] },
        ];

        setResume({
          id: `local-${Date.now()}`,
          header: {
            name: parsed.name || "Uploaded Candidate",
            title: "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            location: "",
          },
          summary: parsed.summary || "",
          sections,
        });

        setUploadSuccess(true);
        setUploadError("Server unavailable: parsed locally and loaded your resume.");
      } catch {
        setUploadError(error instanceof Error ? error.message : "Failed to parse uploaded resume");
      }
    } finally {
      setUploading(false);
    }
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowLeftPanel((v) => !v)}
          className="rounded border border-slate-500 bg-slate-700 px-2 py-1 transition-colors hover:bg-slate-600"
          title="Toggle sections panel"
        >
          {showLeftPanel ? <PanelLeftClose className="h-4 w-4 text-slate-200" /> : <PanelLeftOpen className="h-4 w-4 text-slate-200" />}
        </button>

        <div className="flex-1 text-center text-sm font-semibold text-slate-200">Resume Document Editor</div>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowRightPanel((v) => !v)}
          className="rounded border border-slate-500 bg-slate-700 px-2 py-1 transition-colors hover:bg-slate-600"
          title="Toggle templates panel"
        >
          {showRightPanel ? <PanelRightClose className="h-4 w-4 text-slate-200" /> : <PanelRightOpen className="h-4 w-4 text-slate-200" />}
        </button>
      </div>

      <div className="grid h-full min-h-0 gap-4" style={{ gridTemplateColumns: `${showLeftPanel ? "220px" : "0px"} 1fr ${showRightPanel ? "140px" : "40px"}` }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`overflow-y-auto ${showLeftPanel ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="rounded-lg border border-slate-700 bg-slate-600/40 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Section Templates</h3>
            <div className="grid gap-2">
              <button onClick={() => addSectionTemplate("experience")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Experience</button>
              <button onClick={() => addSectionTemplate("projects")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Projects</button>
              <button onClick={() => addSectionTemplate("skills")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Skills</button>
              <button onClick={() => addSectionTemplate("education")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Education</button>
              <button onClick={() => addSectionTemplate("achievements")} className="rounded bg-slate-700 px-2 py-1 text-left text-xs">+ Achievements</button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">Upload Resume</h3>
            <ResumeFileUpload
              onFileSelected={handleResumeUpload}
              loading={uploading}
              error={uploadError}
              success={uploadSuccess}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-[#98a09a]"
        >
          <RichDocumentEditor
            initialHtml={renderedHtml}
            templateKey={selectedTemplate}
            templateStyle={selectedTemplateStyle}
            onEditorReady={setEditorInstance}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`${showRightPanel ? "space-y-3 overflow-y-auto" : "hidden"}`}
        >
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full overflow-hidden rounded border ${selectedTemplate === template.id ? "border-cyan-400" : "border-slate-700"}`}
            >
              <div className="aspect-[210/297] w-full overflow-hidden bg-white">
                <div
                  className="origin-top-left scale-[0.18] p-1"
                  style={{ width: "560%" }}
                  dangerouslySetInnerHTML={{
                    __html: render_template(template.id as TemplateId, templateData),
                  }}
                />
              </div>
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
