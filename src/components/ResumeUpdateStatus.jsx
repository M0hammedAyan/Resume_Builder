function ResumeUpdateStatus({ section, isVisible, onClose }) {
  if (!isVisible) return null

  const sectionNames = {
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    achievements: 'Achievements',
    patents: 'Patents & Publications',
    certifications: 'Certifications',
    documents: 'Documents'
  }

  const displayName = sectionNames[section] || (section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Resume')

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in">
      <div className="bg-green-600 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-white font-medium">
            {displayName} added to resume
          </p>
          <button onClick={onClose} className="ml-auto text-white hover:text-gray-200">
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

