import { useState } from 'react'

/**
 * SuggestionCard Component
 * 
 * Displays AI-generated suggestions for resume updates
 * Shows detected category and resume entry
 * Provides Approve/Edit/Reject actions
 */
function SuggestionCard({ suggestion, onApprove, onReject, onEdit }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(suggestion.resumeEntry?.title || '')
  const [editedDescription, setEditedDescription] = useState(suggestion.resumeEntry?.description || '')
  const [editedBullets, setEditedBullets] = useState(suggestion.resumeEntry?.bullets || [])
  const [editedSection, setEditedSection] = useState(suggestion.category || '')

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const editedSuggestion = {
      ...suggestion,
      category: editedSection,
      resumeEntry: {
        title: editedTitle,
        description: editedDescription,
        bullets: editedBullets
      },
      data: {
        ...suggestion.data,
        title: editedTitle,
        description: editedDescription,
        bullets: editedBullets
      }
    }
    onApprove(editedSuggestion)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(suggestion.resumeEntry?.title || '')
    setEditedDescription(suggestion.resumeEntry?.description || '')
    setEditedBullets(suggestion.resumeEntry?.bullets || [])
    setEditedSection(suggestion.category || '')
    setIsEditing(false)
  }

  const handleBulletChange = (index, value) => {
    const newBullets = [...editedBullets]
    newBullets[index] = value
    setEditedBullets(newBullets)
  }

  return (
    <div className="max-w-2xl border-2 border-gray-600 rounded-lg bg-[#343541] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
            {suggestion.category}
          </span>
          <span className="text-sm text-gray-300">
            Resume Entry Suggestion
          </span>
          {suggestion.source && (
            <span className="text-xs text-gray-400">
              from {suggestion.source}
            </span>
          )}
        </div>
      </div>

      {/* Document Import Preview */}
      {suggestion.isDocumentImport && suggestion.data && (
        <div className="mb-4 p-3 bg-[#40414f] border border-gray-600 rounded">
          <h4 className="text-sm font-semibold text-white mb-2">
            Document Content Preview:
          </h4>
          <div className="max-h-40 overflow-y-auto text-xs text-gray-300 whitespace-pre-wrap bg-[#2a2b32] p-2 rounded border border-gray-700">
            {suggestion.data.rawText.substring(0, 500)}
            {suggestion.data.rawText.length > 500 && '...'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {suggestion.data.rawText.split('\n').length} lines extracted
          </p>
        </div>
      )}

      {/* Resume Entry Preview */}
      {suggestion.resumeEntry && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">
            Resume Entry:
          </h4>
          {isEditing ? (
            <div className="bg-[#40414f] border border-gray-600 rounded p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Section</label>
                <select
                  value={editedSection}
                  onChange={(e) => setEditedSection(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-[#2a2b32] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Education">Education</option>
                  <option value="Experience">Experience</option>
                  <option value="Projects">Projects</option>
                  <option value="Skills">Skills</option>
                  <option value="Achievements">Achievements</option>
                  <option value="Patents">Patents</option>
                  <option value="Certifications">Certifications</option>
                </select>
              </div>
              {suggestion.resumeEntry.title && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-[#2a2b32] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              {suggestion.resumeEntry.description && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1 text-sm bg-[#2a2b32] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              {editedBullets && editedBullets.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Bullets</label>
                  {editedBullets.map((bullet, idx) => (
                    <textarea
                      key={idx}
                      value={bullet}
                      onChange={(e) => handleBulletChange(idx, e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-sm bg-[#2a2b32] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#40414f] border border-gray-600 rounded p-3">
              {suggestion.resumeEntry.title && (
                <h5 className="font-semibold text-white mb-1">
                  {suggestion.resumeEntry.title}
                </h5>
              )}
              {suggestion.resumeEntry.description && (
                <p className="text-sm text-gray-300 mb-2">
                  {suggestion.resumeEntry.description}
                </p>
              )}
              {suggestion.resumeEntry.bullets && suggestion.resumeEntry.bullets.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {suggestion.resumeEntry.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resume Bullets (fallback for older format) */}
      {!suggestion.resumeEntry && suggestion.resumeBullets && suggestion.resumeBullets.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Resume Entry:
          </h4>
          {isEditing ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              {(editedBullets || []).map((bullet, idx) => (
                <textarea
                  key={idx}
                  value={bullet}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                />
              ))}
            </div>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
              {suggestion.resumeBullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-600">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Save & Add to Resume
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(suggestion)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Add to Resume
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SuggestionCard

