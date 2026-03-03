import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import SuggestionCard from './SuggestionCard'
import FileUpload from './FileUpload'
import { Message, Suggestion } from '../types'

interface ChatWindowProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  onFileUpload: (file: File) => void
  pendingSuggestion: Suggestion | null
  onApprove: (suggestion: Suggestion) => void
  onReject: () => void
  onEdit: () => void
}

function ChatWindow({
  messages,
  onSendMessage,
  onFileUpload,
  pendingSuggestion,
  onApprove,
  onReject,
  onEdit
}: ChatWindowProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingSuggestion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4">
        <div className="max-w-3xl mx-auto py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">Start updating your resume</p>
                <p className="text-sm">
                  Share a professional update and I'll help you add it to your resume.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {pendingSuggestion && (
            <div className="py-6">
              <SuggestionCard
                suggestion={pendingSuggestion}
                onApprove={onApprove}
                onReject={onReject}
                onEdit={onEdit}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-700 bg-[#343541] px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 items-center bg-[#40414f] rounded-lg px-4 py-3">
              <FileUpload onFileUpload={onFileUpload} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message ProMind..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
