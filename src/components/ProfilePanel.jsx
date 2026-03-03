import { useState } from 'react'

/**
 * ProfilePanel Component
 * 
 * Side panel displaying structured professional profile
 * Shows how the profile evolves over time as user approves updates
 * Sections are collapsible for better organization
 */
function ProfilePanel({ profile, onPreviewResume }) {
  const [expandedSections, setExpandedSections] = useState({
    education: true,
    experience: true,
    projects: true,
    skills: true,
    achievements: true,
    documents: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const SectionHeader = ({ title, count, isExpanded, onToggle }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 px-3 text-left hover:bg-gray-100 transition-colors"
    >
      <span className="font-semibold text-sm text-gray-900">
        {title}
      </span>
      <div className="flex items-center gap-2">
        {count > 0 && (
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
            {count}
          </span>
        )}
        <span className="text-gray-400 text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
    </button>
  )

  const renderSection = (title, items, sectionKey) => {
    const isExpanded = expandedSections[sectionKey]
    
    return (
      <div className="border-b border-gray-200">
        <SectionHeader
          title={title}
          count={items.length}
          isExpanded={isExpanded}
          onToggle={() => toggleSection(sectionKey)}
        />
        {isExpanded && (
          <div className="px-3 pb-3">
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                No {title.toLowerCase()} added yet
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-gray-700 bg-white border border-gray-200 rounded p-2"
                  >
                    {typeof item === 'string' ? (
                      <p>{item}</p>
                    ) : item.fileName ? (
                      // Document import
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <svg
                            className="w-3 h-3 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="font-medium">{item.fileName}</p>
                        </div>
                        {item.importedAt && (
                          <p className="text-gray-500 text-xs">
                            Imported: {new Date(item.importedAt).toLocaleDateString()}
                          </p>
                        )}
                        {item.rawContent && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {item.rawContent.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {item.title && (
                          <p className="font-medium mb-1">{item.title}</p>
                        )}
                        {item.description && (
                          <p className="text-gray-600">{item.description}</p>
                        )}
                        {item.bullets && (
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {item.bullets.map((bullet, i) => (
                              <li key={i} className="text-gray-600">{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Resume Sections
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Your living resume
            </p>
          </div>
          {onPreviewResume && (
            <button
              onClick={onPreviewResume}
              className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
            >
              Preview
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {renderSection('Education', profile.education || [], 'education')}
        {renderSection('Experience', profile.experience || [], 'experience')}
        {renderSection('Projects', profile.projects || [], 'projects')}
        {renderSection('Skills', profile.skills || [], 'skills')}
        {renderSection('Achievements', profile.achievements || [], 'achievements')}
        {profile.documents && profile.documents.length > 0 && (
          renderSection('Imported Documents', profile.documents, 'documents')
        )}
      </div>
    </div>
  )
}

export default ProfilePanel

