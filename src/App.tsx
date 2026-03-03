import { useState } from 'react'
import AppLayout from './components/AppLayout'
import ChatWindow from './components/ChatWindow'
import ProfilePanel from './components/ProfilePanel'
import { mockAIResponse } from './utils/mockAPI'
import { Profile, Message, Suggestion, UpdateStatus } from './types'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<Profile>({
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: [],
    patents: [],
    certifications: []
  })
  const [pendingSuggestion, setPendingSuggestion] = useState<Suggestion | null>(null)
  const [showResumePreview, setShowResumePreview] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ visible: false, section: null })
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleSendMessage = async (userMessage: string) => {
    const userMsg: Message = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    setTimeout(async () => {
      const aiResponse = await mockAIResponse(userMessage)
      
      const aiMsg: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])

      if (aiResponse.suggestion) {
        setPendingSuggestion(aiResponse.suggestion)
      }
    }, 1000)
  }

  const mapCategoryToSection = (category: string): keyof Profile => {
    const categoryLower = category.toLowerCase().trim()
    const sectionMap: Record<string, keyof Profile> = {
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

  const handleApproveSuggestion = (suggestion: Suggestion) => {
    const updatedProfile = { ...profile }
    const sectionKey = mapCategoryToSection(suggestion.category)
    
    if (!updatedProfile[sectionKey]) {
      updatedProfile[sectionKey] = []
    }
    
    updatedProfile[sectionKey] = [...updatedProfile[sectionKey], suggestion.data]
    
    setProfile(updatedProfile)
    setPendingSuggestion(null)

    setUpdateStatus({ visible: true, section: sectionKey })
    
    setTimeout(() => {
      setUpdateStatus({ visible: false, section: null })
    }, 5000)
  }

  const handleReorder = (section: keyof Profile, items: ResumeEntry[]) => {
    setProfile({ ...profile, [section]: items })
  }

  const handleRejectSuggestion = () => {
    setPendingSuggestion(null)
  }

  const handleEditSuggestion = () => {
    setPendingSuggestion(null)
  }

  const handleFileUpload = async (file: File) => {
    const userMsg: Message = {
      id: Date.now(),
      type: 'user',
      content: `📎 Uploaded file: ${file.name}`,
      timestamp: new Date(),
      isFile: true,
      fileName: file.name
    }
    setMessages(prev => [...prev, userMsg])

    const processingMsg: Message = {
      id: Date.now() + 1,
      type: 'ai',
      content: 'Processing your document...',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, processingMsg])
  }

  const handleDownloadResume = async (format: string = 'pdf') => {
    try {
      const resumeText = generateResumeText(profile)
      
      let mimeType = 'text/plain'
      let fileName = 'resume.txt'
      
      if (format === 'pdf' || format === 'docx') {
        alert(`${format.toUpperCase()} generation requires backend service. Downloading as text file for demo.`)
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

  const generateResumeText = (profile: Profile): string => {
    let text = 'PROFESSIONAL RESUME\n\n'
    
    if (profile.education && profile.education.length > 0) {
      text += 'EDUCATION\n'
      text += '─'.repeat(50) + '\n'
      profile.education.forEach(item => {
        text += `• ${item.title}\n`
        if (item.description) text += `  ${item.description}\n`
      })
      text += '\n'
    }

    if (profile.experience && profile.experience.length > 0) {
      text += 'EXPERIENCE\n'
      text += '─'.repeat(50) + '\n'
      profile.experience.forEach(item => {
        text += `• ${item.title}\n`
        if (item.description) text += `  ${item.description}\n`
        if (item.bullets) {
          item.bullets.forEach(bullet => text += `  - ${bullet}\n`)
        }
      })
      text += '\n'
    }

    if (profile.projects && profile.projects.length > 0) {
      text += 'PROJECTS\n'
      text += '─'.repeat(50) + '\n'
      profile.projects.forEach(item => {
        text += `• ${item.title}\n`
        if (item.description) text += `  ${item.description}\n`
      })
      text += '\n'
    }

    if (profile.skills && profile.skills.length > 0) {
      text += 'SKILLS\n'
      text += '─'.repeat(50) + '\n'
      profile.skills.forEach(item => {
        text += `• ${item.title}\n`
      })
      text += '\n'
    }

    if (profile.achievements && profile.achievements.length > 0) {
      text += 'ACHIEVEMENTS\n'
      text += '─'.repeat(50) + '\n'
      profile.achievements.forEach(item => {
        text += `• ${item.title}\n`
      })
    }

    return text
  }

  return (
    <AppLayout onDownloadResume={handleDownloadResume}>
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed left-4 top-20 bg-white text-gray-700 p-3 rounded-2xl hover:bg-gray-50 transition-all shadow-xl border-2 border-gray-200 z-30 hover:scale-110 transform"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex flex-1 overflow-hidden">
        <div className={`fixed left-0 top-0 h-screen bg-gray-50 border-r border-gray-200 transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'} w-80 shadow-lg z-20`}>
          <ProfilePanel 
            profile={profile}
            onPreviewResume={() => setShowResumePreview(true)}
            onReorder={handleReorder}
          />
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isPanelOpen ? 'ml-80' : 'ml-0'}`}>
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
      </div>
    </AppLayout>
  )
}

export default App
