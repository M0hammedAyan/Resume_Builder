import { useState } from 'react'
import { Profile } from '../types'
import ClassicTemplate from './templates/ClassicTemplate'
import ModernTemplate from './templates/ModernTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import TemplateSelector from './TemplateSelector'
import { exportToPDF } from '../utils/pdfExport'

interface ResumePreviewProps {
  profile: Profile
  isOpen: boolean
  onClose: () => void
  onDownload?: (format: string) => void
}

function ResumePreview({ profile, isOpen, onClose }: ResumePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('classic')
  const [isExporting, setIsExporting] = useState(false)
  const [personalInfo, setPersonalInfo] = useState({
    name: 'Your Name',
    email: 'your.email@example.com',
    phone: '+1 (555) 123-4567'
  })

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      await exportToPDF('resume-preview', `${personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`)
    } catch (error) {
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderTemplate = () => {
    const props = {
      profile,
      name: personalInfo.name,
      email: personalInfo.email,
      phone: personalInfo.phone
    }

    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate {...props} />
      case 'minimal':
        return <MinimalTemplate {...props} />
      default:
        return <ClassicTemplate {...props} />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto bg-gray-50 rounded-lg shadow-xl">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center print:hidden">
            <h2 className="text-2xl font-bold text-gray-900">Resume Preview</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 print:hidden">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={personalInfo.name}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />

            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>

          <div className="p-6 bg-gray-100">
            <div id="resume-preview" className="shadow-lg">
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePreview
