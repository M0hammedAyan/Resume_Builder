/**
 * ResumeUpdateStatus Component
 * 
 * Displays clear visual confirmation when a resume section is updated
 * Essential for communicating trust and transparency
 */
function ResumeUpdateStatus({ section, isVisible, onClose }) {
  if (!isVisible) return null

  const sectionNames = {
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    achievements: 'Achievements',
    documents: 'Documents'
  }

  const displayName = sectionNames[section] || (section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Resume')

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in">
      <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {displayName} section updated
            </h3>
            <p className="text-xs text-gray-600">
              Your resume has been updated. Would you like to preview it?
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResumeUpdateStatus

