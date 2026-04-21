import DownloadResumeButton from './DownloadResumeButton'
import ThemeToggle from './ThemeToggle'

interface AppLayoutProps {
  children: React.ReactNode
  onDownloadResume: (format: string) => void
}

function AppLayout({ children, onDownloadResume }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col app-shell-gradient">
      <header className="relative z-20 border-b border-slate-200/80 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                CareerOS
              </h1>
              <p className="text-xs text-slate-500">AI Resume Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DownloadResumeButton onDownload={onDownloadResume} />
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default AppLayout

