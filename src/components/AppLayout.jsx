import DownloadResumeButton from './DownloadResumeButton'

/**
 * AppLayout Component
 * 
 * Provides the main layout structure with header
 * Clean, professional design suitable for academic presentation
 * Resume-focused interface
 */
function AppLayout({ children, onDownloadResume }) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ProMind</h1>
            <p className="text-sm text-gray-600 mt-1">
              Conversational AI Resume Assistant
            </p>
          </div>
          {onDownloadResume && (
            <DownloadResumeButton onDownload={onDownloadResume} />
          )}
        </div>
      </header>

      {/* Main Content - Allows scrolling within children */}
      <main className="flex-1 min-h-0">
        {children}
      </main>

      {/* Trust Note */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-2">
        <p className="text-xs text-gray-500 text-center">
          No changes are made without your approval
        </p>
      </div>
    </div>
  )
}

export default AppLayout

