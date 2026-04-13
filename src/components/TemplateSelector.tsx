import { motion } from "framer-motion";
import { getAllTemplates, render_template, type TemplateId } from "../config/resume.templates";
import { useCareerOSStore } from "../store/careeros.store";
import { mapStoreResumeToTemplateData } from "../utils/templateResumeMapper";
import { CheckCircle2 } from "lucide-react";

export function TemplateSelector() {
  const { selectedTemplate, setSelectedTemplate, resume } = useCareerOSStore();
  const templates = getAllTemplates();
  if (!resume) return null;
  const currentTemplateData = mapStoreResumeToTemplateData(resume) as unknown as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">
          Choose Your Resume Template
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Select a design that best represents your professional brand
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <motion.button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`relative rounded-xl border-2 p-4 transition duration-200 ${
              selectedTemplate === template.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            {/* Template Preview */}
            <div
              className="mb-3 aspect-[210/297] w-full overflow-hidden rounded-lg border border-slate-700 bg-white"
              style={{
                background: template.colors.background,
              }}
            >
              <div
                className="origin-top-left scale-[0.2] p-2"
                style={{ width: "500%" }}
                dangerouslySetInnerHTML={{
                  __html: render_template(
                    template.id as TemplateId,
                    currentTemplateData,
                  ),
                }}
              />
            </div>

            {/* Template Info */}
            <div className="text-left">
              <h4 className="font-semibold text-slate-100">{template.name}</h4>
              <p className="mt-1 text-xs text-slate-400">
                {template.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {template.recommendedFor.slice(0, 2).map((rec) => (
                  <span
                    key={rec}
                    className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300"
                  >
                    {rec}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected Indicator */}
            {selectedTemplate === template.id && (
              <motion.div
                layoutId="selectedTemplate"
                className="absolute top-2 right-2"
              >
                <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
