import DownloadResumeButton from './DownloadResumeButton'
import ThemeToggle from './ThemeToggle'

interface AppLayoutProps {
  children: React.ReactNode
  onDownloadResume: (format: string) => void
}

function AppLayout({ children, onDownloadResume }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black">
      <header className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border-b border-white/20 dark:border-white/10 px-6 py-4 relative z-20 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                CareerOS
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">AI Resume Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DownloadResumeButton onDownload={onDownloadResume} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        {children}
      </main>
    </div>
  )
}

export default AppLayout

