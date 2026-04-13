import { motion } from "framer-motion";
import { getAllTemplates, render_template, type TemplateId } from "../config/resume.templates";
import { useCareerOSStore } from "../store/careeros.store";
import { mapStoreResumeToTemplateData } from "../utils/templateResumeMapper";
import { Globe, Target, Zap } from "lucide-react";

export function TemplateGalleryView() {
  const { selectedTemplate, setSelectedTemplate, resume } = useCareerOSStore();
  const templates = getAllTemplates();
  if (!resume) return null;
  const currentTemplateData = mapStoreResumeToTemplateData(resume) as unknown as Record<string, unknown>;

  const categoryIcons: Record<string, React.ReactNode> = {
    ats: <Target className="h-4 w-4" />,
    creative: <Zap className="h-4 w-4" />,
    professional: <Globe className="h-4 w-4" />,
    technical: <Globe className="h-4 w-4" />,
    executive: <Globe className="h-4 w-4" />,
    modern: <Zap className="h-4 w-4" />,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-slate-100">Resume Templates</h2>
        <p className="mt-2 text-slate-400">
          Choose from professional templates designed for different industries and career stages
        </p>
      </motion.div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => setSelectedTemplate(template.id)}
            className={`relative group cursor-pointer rounded-xl border-2 overflow-hidden transition ${
              selectedTemplate === template.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            {/* Template Preview */}
            <div
              className="aspect-[210/297] w-full overflow-hidden bg-white"
              style={{
                background: template.colors.background,
              }}
            >
              <div
                className="origin-top-left scale-[0.31] p-3"
                style={{ width: "323%" }}
                dangerouslySetInnerHTML={{
                  __html: render_template(
                    template.id as TemplateId,
                    currentTemplateData,
                  ),
                }}
              />
            </div>

            {/* Template Info */}
            <div className="relative p-4 border-t border-slate-800 bg-slate-900/70">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-100">{template.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {template.description}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg bg-slate-800 text-slate-400"
                  title={template.category}
                >
                  {categoryIcons[template.category]}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {template.recommendedFor.map((rec) => (
                  <span
                    key={rec}
                    className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300"
                  >
                    {rec}
                  </span>
                ))}
              </div>

              {/* Hover Info */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-t-xl invisible group-hover:visible"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {selectedTemplate === template.id
                      ? "✓ Selected"
                      : "Click to Select"}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6"
        >
          {(() => {
            const selected = templates.find((t) => t.id === selectedTemplate);
            if (!selected) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-100 mb-3">
                    Template Features
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>
                      • <span className="text-cyan-400">Columns:</span>{" "}
                      {selected.layout.columns}-column layout
                    </li>
                    <li>
                      • <span className="text-cyan-400">Header:</span>{" "}
                      {selected.layout.headerStyle} alignment
                    </li>
                    <li>
                      • <span className="text-cyan-400">Skills:</span>{" "}
                      {selected.layout.skillsLayout} layout
                    </li>
                    <li>
                      • <span className="text-cyan-400">Sections:</span>{" "}
                      {selected.layout.sectionBorder ? "Bordered" : "Clean"} sections
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-100 mb-3">
                    Font Family
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>
                      • <span className="text-cyan-400">Headings:</span>{" "}
                      {selected.fontFamily.heading}
                    </li>
                    <li>
                      • <span className="text-cyan-400">Body:</span>{" "}
                      {selected.fontFamily.body}
                    </li>
                    <li>
                      • <span className="text-cyan-400">Base Size:</span>{" "}
                      {selected.fontSize.body}px
                    </li>
                    <li>
                      • <span className="text-cyan-400">Line Height:</span>{" "}
                      {selected.lineHeight}
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
