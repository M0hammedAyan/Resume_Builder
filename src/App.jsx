import { useState } from 'react'
import AppLayout from './components/AppLayout'
import ChatWindow from './components/ChatWindow'
import ProfilePanel from './components/ProfilePanel'
import ResumePreview from './components/ResumePreview'
import ResumeUpdateStatus from './components/ResumeUpdateStatus'
import DownloadResumeButton from './components/DownloadResumeButton'
import { mockAIResponse } from './utils/mockAPI'
import { parseFile, processDocumentContent } from './utils/fileParser'

/**
 * Main App Component
 * 
 * Manages global state for:
 * - Chat history (messages between user and AI)
 * - Professional profile (structured data that evolves)
 * - Pending suggestions (AI-generated updates awaiting approval)
 */
function App() {
  const [messages, setMessages] = useState([])
  const [profile, setProfile] = useState({
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: [],
    patents: [],
    certifications: []
  })
  const [pendingSuggestion, setPendingSuggestion] = useState(null)
  const [showResumePreview, setShowResumePreview] = useState(false)
  const [updateStatus, setUpdateStatus] = useState({ visible: false, section: null })
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  /**
   * Handles user message submission
   * Simulates AI processing and generates a suggestion
   */
  const handleSendMessage = async (userMessage) => {
    // Add user message to chat
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    // Simulate AI processing delay
    setTimeout(async () => {
      // Get AI response and suggestion from mock API
      const aiResponse = await mockAIResponse(userMessage)
      
      // Add AI message to chat
      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])

      // If AI detected an update, show suggestion card
      if (aiResponse.suggestion) {
        setPendingSuggestion(aiResponse.suggestion)
      }
    }, 1000)
  }

  /**
   * Maps AI category to resume state section key
   * Handles singular/plural differences (e.g., "Project" -> "projects")
   */
  const mapCategoryToSection = (category) => {
    const categoryLower = category.toLowerCase().trim()
    const sectionMap = {
      'project': 'projects',
      'projects': 'projects',
      'skill': 'skills',
      'skills': 'skills',
      'education': 'education',
      'experience': 'experience',
      'achievement': 'achievements',
      'achievements': 'achievements',
      'patent': 'patents',
      'patents': 'patents',
      'publication': 'patents',
      'certification': 'certifications',
      'certifications': 'certifications'
    }
    return sectionMap[categoryLower] || 'experience'
  }

  /**
   * Handles approval of an AI suggestion
   * Updates the profile and clears the pending suggestion
   * FIXED: Now correctly maps category to the right section
   */
  const handleApproveSuggestion = (suggestion) => {
    const updatedProfile = { ...profile }
    
    // Handle document imports differently
    if (suggestion.isDocumentImport) {
      // For document imports, add the raw text and parsed sections
      // In a real app, this would be more sophisticated
      const documentData = {
        fileName: suggestion.data.fileName,
        importedAt: suggestion.data.importedAt,
        rawContent: suggestion.data.rawText,
        sections: suggestion.data.sections
      }
      
      // Add to a special "Documents" section or merge into existing sections
      // For simplicity, we'll add it as a document entry
      if (!updatedProfile.documents) {
        updatedProfile.documents = []
      }
      updatedProfile.documents.push(documentData)
      
      // Also try to merge parsed sections into existing profile sections
      Object.entries(suggestion.data.sections).forEach(([section, items]) => {
        if (items.length > 0 && updatedProfile[section]) {
          items.forEach(item => {
            if (typeof item === 'string' && item.length > 10) {
              updatedProfile[section].push(item)
            }
          })
        }
      })
    } else {
      // Regular suggestion - map category to correct section key
      const sectionKey = mapCategoryToSection(suggestion.category)
      
      // Ensure the section exists in profile
      if (!updatedProfile[sectionKey]) {
        updatedProfile[sectionKey] = []
      }
      
      // Add the entry to the correct section
      updatedProfile[sectionKey] = [...updatedProfile[sectionKey], suggestion.data]
    }
    
    setProfile(updatedProfile)
    setPendingSuggestion(null)

    // Show update status notification with correct section name
    const sectionKey = suggestion.isDocumentImport 
      ? 'documents' 
      : mapCategoryToSection(suggestion.category)
    setUpdateStatus({ visible: true, section: sectionKey })
    
    // Auto-hide status after 5 seconds
    setTimeout(() => {
      setUpdateStatus({ visible: false, section: null })
    }, 5000)

    // Add confirmation message to chat with correct section name
    const sectionDisplayName = suggestion.isDocumentImport 
      ? 'Document'
      : suggestion.category
  }

  /**
   * Handles rejection of an AI suggestion
   * Simply clears the pending suggestion
   */
  const handleRejectSuggestion = () => {
    setPendingSuggestion(null)
  }

  /**
   * Handles editing a suggestion
   * For now, just clears it (in a real app, would open an editor)
   */
  const handleEditSuggestion = () => {
    // In a full implementation, this would open an edit modal
    setPendingSuggestion(null)
  }

  /**
   * Handles file upload (PDF or Word document)
   * Extracts content and creates a suggestion for importing
   */
  const handleFileUpload = async (file) => {
    // Add user message about file upload
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: `📎 Uploaded file: ${file.name}`,
      timestamp: new Date(),
      isFile: true,
      fileName: file.name
    }
    setMessages(prev => [...prev, userMsg])

    // Show processing message
    const processingMsg = {
      id: Date.now() + 1,
      type: 'ai',
      content: 'Processing your document...',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, processingMsg])

    try {
      // Parse the file
      const extractedText = await parseFile(file)
      
      // Process the content and create suggestion
      const suggestion = processDocumentContent(extractedText, file.name)
      
      // Add AI message
      const aiMsg = {
        id: Date.now() + 2,
        type: 'ai',
        content: `I've extracted content from ${file.name}. Review the suggestion below to import it into your resume.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])

      // Show suggestion card
      setPendingSuggestion(suggestion)
    } catch (error) {
      // Show error message
      const errorMsg = {
        id: Date.now() + 2,
        type: 'ai',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  /**
   * Handles resume download with format selection
   * In a real app, this would call the backend API to generate PDF/DOCX
   * For now, generates formatted text that can be saved as the requested format
   */
  const handleDownloadResume = async (format = 'pdf') => {
    try {
      // In production, this would call the backend:
      // const response = await fetch(`/api/resume/download?format=${format}`, { method: 'POST' })
      // const blob = await response.blob()
      // const url = URL.createObjectURL(blob)
      
      // For demo: Generate formatted text
      const resumeText = generateResumeText(profile)
      
      // Determine MIME type and file extension based on format
      let mimeType, fileExtension, fileName
      
      if (format === 'pdf') {
        // In production, backend would generate actual PDF
        // For now, we'll create a text file that can be converted
        mimeType = 'application/pdf'
        fileExtension = 'pdf'
        fileName = 'resume.pdf'
        // Note: Actual PDF generation requires a library like jsPDF or backend service
        // This is a placeholder - in production, use backend API
        alert('PDF generation requires backend service. Downloading as text file for demo.')
        mimeType = 'text/plain'
        fileExtension = 'txt'
        fileName = 'resume.txt'
      } else if (format === 'docx') {
        // In production, backend would generate actual DOCX
        // For now, we'll create a text file that can be converted
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        fileExtension = 'docx'
        fileName = 'resume.docx'
        // Note: Actual DOCX generation requires a library like docx or backend service
        // This is a placeholder - in production, use backend API
        alert('Word document generation requires backend service. Downloading as text file for demo.')
        mimeType = 'text/plain'
        fileExtension = 'txt'
        fileName = 'resume.txt'
      } else {
        mimeType = 'text/plain'
        fileExtension = 'txt'
        fileName = 'resume.txt'
      }
      
      const blob = new Blob([resumeText], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Failed to download resume. Please try again.')
    }
  }

  /**
   * Generates a simple text version of the resume
   * In production, backend would generate PDF/DOCX
   */
  const generateResumeText = (profile) => {
    let text = 'PROFESSIONAL RESUME\n\n'
    
    if (profile.education && profile.education.length > 0) {
      text += 'EDUCATION\n'
      text += '─'.repeat(50) + '\n'
      profile.education.forEach(item => {
        if (typeof item === 'string') {
          text += `• ${item}\n`
        } else if (item.title) {
          text += `• ${item.title}\n`
          if (item.description) text += `  ${item.description}\n`
        }
      })
      text += '\n'
    }

    if (profile.experience && profile.experience.length > 0) {
      text += 'EXPERIENCE\n'
      text += '─'.repeat(50) + '\n'
      profile.experience.forEach(item => {
        if (typeof item === 'string') {
          text += `• ${item}\n`
        } else if (item.title) {
          text += `• ${item.title}\n`
          if (item.description) text += `  ${item.description}\n`
          if (item.bullets) {
            item.bullets.forEach(bullet => text += `  - ${bullet}\n`)
          }
        }
      })
      text += '\n'
    }

    if (profile.projects && profile.projects.length > 0) {
      text += 'PROJECTS\n'
      text += '─'.repeat(50) + '\n'
      profile.projects.forEach(item => {
        if (typeof item === 'string') {
          text += `• ${item}\n`
        } else if (item.title) {
          text += `• ${item.title}\n`
          if (item.description) text += `  ${item.description}\n`
          if (item.bullets) {
            item.bullets.forEach(bullet => text += `  - ${bullet}\n`)
          }
        }
      })
      text += '\n'
    }

    if (profile.skills && profile.skills.length > 0) {
      text += 'SKILLS\n'
      text += '─'.repeat(50) + '\n'
      profile.skills.forEach(item => {
        if (typeof item === 'string') {
          text += `• ${item}\n`
        } else if (item.title) {
          text += `• ${item.title}\n`
        }
      })
      text += '\n'
    }

    if (profile.achievements && profile.achievements.length > 0) {
      text += 'ACHIEVEMENTS\n'
      text += '─'.repeat(50) + '\n'
      profile.achievements.forEach(item => {
        if (typeof item === 'string') {
          text += `• ${item}\n`
        } else if (item.title) {
          text += `• ${item.title}\n`
        }
      })
    }

    return text
  }

  return (
    <AppLayout onDownloadResume={handleDownloadResume}>
      <div className="flex flex-1 min-h-0 relative">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            pendingSuggestion={pendingSuggestion}
            onApprove={handleApproveSuggestion}
            onReject={handleRejectSuggestion}
            onEdit={handleEditSuggestion}
          />
        </div>

        {/* Profile Side Panel - Collapsible */}
        <div className={`absolute right-0 top-0 h-full bg-gray-50 border-l border-gray-200 transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'} w-80 shadow-lg`}>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="absolute -left-8 top-4 bg-gray-50 border border-gray-200 rounded-l-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isPanelOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <ProfilePanel 
            profile={profile}
            onPreviewResume={() => setShowResumePreview(true)}
          />
        </div>
      </div>

      <ResumePreview
        profile={profile}
        isOpen={showResumePreview}
        onClose={() => setShowResumePreview(false)}
        onDownload={handleDownloadResume}
      />

      <ResumeUpdateStatus
        section={updateStatus.section}
        isVisible={updateStatus.visible}
        onClose={() => setUpdateStatus({ visible: false, section: null })}
      />
    </AppLayout>
  )
}

export default App

