/**
 * SuggestionCard Component
 * 
 * Displays AI-generated suggestions for resume updates
 * Shows detected category and resume entry
 * Provides Approve/Edit/Reject actions
 */
function SuggestionCard({ suggestion, onApprove, onReject, onEdit }) {
  return (
    <div className="max-w-2xl border-2 border-primary-200 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
            {suggestion.category}
          </span>
          <span className="text-sm text-gray-600">
            Resume Entry Suggestion
          </span>
          {suggestion.source && (
            <span className="text-xs text-gray-500">
              from {suggestion.source}
            </span>
          )}
        </div>
      </div>

      {/* Document Import Preview */}
      {suggestion.isDocumentImport && suggestion.data && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Document Content Preview:
          </h4>
          <div className="max-h-40 overflow-y-auto text-xs text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
            {suggestion.data.rawText.substring(0, 500)}
            {suggestion.data.rawText.length > 500 && '...'}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {suggestion.data.rawText.split('\n').length} lines extracted
          </p>
        </div>
      )}

      {/* Resume Entry Preview */}
      {suggestion.resumeEntry && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Resume Entry:
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            {suggestion.resumeEntry.title && (
              <h5 className="font-semibold text-gray-900 mb-1">
                {suggestion.resumeEntry.title}
              </h5>
            )}
            {suggestion.resumeEntry.description && (
              <p className="text-sm text-gray-700 mb-2">
                {suggestion.resumeEntry.description}
              </p>
            )}
            {suggestion.resumeEntry.bullets && suggestion.resumeEntry.bullets.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {suggestion.resumeEntry.bullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Resume Bullets (fallback for older format) */}
      {!suggestion.resumeEntry && suggestion.resumeBullets && suggestion.resumeBullets.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Resume Entry:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
            {suggestion.resumeBullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={() => onApprove(suggestion)}
          className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 transition-colors"
        >
          Add to Resume
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default SuggestionCard

