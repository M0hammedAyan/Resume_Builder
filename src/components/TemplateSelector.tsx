interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (template: string) => void
}

function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const templates = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional serif layout',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded p-2">
          <div className="text-center border-b border-gray-400 pb-1 mb-2">
            <div className="h-2 bg-gray-800 w-16 mx-auto mb-1"></div>
            <div className="h-1 bg-gray-400 w-24 mx-auto"></div>
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-gray-600 w-12"></div>
            <div className="h-1 bg-gray-300 w-full"></div>
            <div className="h-1 bg-gray-300 w-full"></div>
          </div>
        </div>
      )
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Two-column with sidebar',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded flex overflow-hidden">
          <div className="w-1/3 bg-gray-800 p-2">
            <div className="h-2 bg-blue-400 w-8 mb-2"></div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-300 w-full"></div>
              <div className="h-1 bg-gray-300 w-full"></div>
            </div>
          </div>
          <div className="w-2/3 p-2">
            <div className="h-2 bg-gray-800 w-16 mb-2"></div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-400 w-full"></div>
              <div className="h-1 bg-gray-400 w-full"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and spacious',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded p-2">
          <div className="mb-3">
            <div className="h-3 bg-gray-900 w-20 mb-1"></div>
            <div className="h-1 bg-gray-300 w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-1 bg-gray-200 w-8"></div>
            <div className="h-1 bg-gray-400 w-full"></div>
            <div className="h-1 bg-gray-400 w-3/4"></div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Template</h3>
      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTemplate === template.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {template.preview}
            <div className="mt-3 text-left">
              <h4 className="font-semibold text-gray-900">{template.name}</h4>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TemplateSelector
