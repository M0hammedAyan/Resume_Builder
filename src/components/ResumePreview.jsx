/**
 * ResumePreview Component
 * 
 * Displays the full resume content in a clean, professional format
 * ATS-friendly, academic tone, no decorative clutter
 */
import DownloadResumeButton from './DownloadResumeButton'

function ResumePreview({ profile, isOpen, onClose, onDownload }) {
  const handleDownload = (format) => {
    if (onDownload) {
      onDownload(format)
    }
  }
  if (!isOpen) return null

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null

    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">
          {title}
        </h2>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700">
              {typeof item === 'string' ? (
                <p className="mb-1">{item}</p>
              ) : (
                <div>
                  {item.title && (
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="mb-1 text-gray-700">{item.description}</p>
                  )}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                      {item.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  {item.date && (
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasContent = 
    (profile.education && profile.education.length > 0) ||
    (profile.experience && profile.experience.length > 0) ||
    (profile.projects && profile.projects.length > 0) ||
    (profile.skills && profile.skills.length > 0) ||
    (profile.achievements && profile.achievements.length > 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h1 className="text-2xl font-bold text-gray-900">Resume Preview</h1>
          <div className="flex items-center gap-3">
            {onDownload && (
              <DownloadResumeButton onDownload={handleDownload} />
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-8">
          {!hasContent ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your resume is empty.</p>
              <p className="text-sm text-gray-400">
                Start chatting to add content to your resume.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {renderSection('Education', profile.education)}
              {renderSection('Experience', profile.experience)}
              {renderSection('Projects', profile.projects)}
              {renderSection('Skills', profile.skills)}
              {renderSection('Achievements', profile.achievements)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumePreview

