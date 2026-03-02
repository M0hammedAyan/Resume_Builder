import DownloadResumeButton from './DownloadResumeButton'

function AppLayout({ children, onDownloadResume }) {
  return (
    <div className="h-screen flex flex-col bg-[#212121]">
      {/* Header */}
      <header className="border-b border-gray-700 bg-[#212121] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">ProMind</h1>
          {onDownloadResume && (
            <DownloadResumeButton onDownload={onDownloadResume} />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default AppLayout

