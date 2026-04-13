import { motion } from "framer-motion";
import { Download, FileDown, Wand2 } from "lucide-react";
import { useCareerOSStore } from "../store/careeros.store";
import { getTemplateById, render_template, suggest_template, type TemplateId } from "../config/resume.templates";
import { mapStoreResumeToTemplateData } from "../utils/templateResumeMapper";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function ResumePreview() {
  const { resume, selectedTemplate } = useCareerOSStore();
  const template = getTemplateById(selectedTemplate);

  if (!resume || !template) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-400">Loading resume...</p>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById("resume-preview");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: template.colors.background,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${resume.header.name}_resume.pdf`);
  };

  const handleDownloadDOCX = () => {
    // Placeholder for DOCX export - would require a library like docx-js
    alert("DOCX export coming soon!");
  };

  const templateData = mapStoreResumeToTemplateData(resume);
  const canonicalResumeData = templateData as unknown as Record<string, unknown>;
  const recommendedTemplate = suggest_template(canonicalResumeData);
  const renderedHtml = render_template(
    selectedTemplate as TemplateId,
    canonicalResumeData,
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"
      >
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/30"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={handleDownloadDOCX}
            className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/30"
          >
            <FileDown className="h-4 w-4" />
            DOCX
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-500/30">
            <Wand2 className="h-4 w-4" />
            Auto Format
          </button>
        </div>
        <span className="text-xs text-slate-500">
          Template: <span className="text-cyan-400 font-medium">{template.name}</span>
        </span>
      </motion.div>

      {recommendedTemplate !== selectedTemplate ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Recommended template: {getTemplateById(recommendedTemplate)?.name ?? recommendedTemplate}
        </div>
      ) : null}

      {/* Resume Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-900/20 p-4"
      >
        <div
          id="resume-preview"
          className="mx-auto bg-white shadow-2xl"
          style={{ width: "210mm", minHeight: "297mm", overflow: "hidden", color: template.colors.text }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </motion.div>
    </div>
  );
}
