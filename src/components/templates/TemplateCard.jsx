import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { TemplatePreview } from "./TemplatePreview";

function TemplateCard({ template, resumeJson, isSelected = false, onPreview, onUse }) {
  return (
    <Card className={`space-y-4 p-4 transition ${isSelected ? "border-slate-900 shadow-slate-300" : "hover:border-slate-300 hover:shadow-md"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
            {isSelected ? <Badge tone="good">Selected</Badge> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{template.description}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="max-h-[260px] overflow-hidden">
          <TemplatePreview template={template} resumeJson={resumeJson} mode="thumbnail" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="capitalize">{template.category}</Badge>
        <Badge tone="neutral">{template.layout.columns === 2 ? "Two-column" : "Single-column"}</Badge>
        <Badge tone="neutral">{template.layout.skillsLayout}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => onPreview(template.id)}>
          Preview
        </Button>
        <Button className="flex-1" onClick={() => onUse(template.id)}>
          Use Template
        </Button>
      </div>
    </Card>
  );
}

export default TemplateCard;
