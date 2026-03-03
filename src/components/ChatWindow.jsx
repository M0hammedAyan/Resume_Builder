import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import SuggestionCard from './SuggestionCard'
import FileUpload from './FileUpload'

/**
 * ChatWindow Component
 * 
 * Main chat interface similar to ChatGPT
 * Displays conversation history and handles user input
 * Shows AI suggestion cards when available
 * Includes file upload functionality for PDF/Word documents
 */
function ChatWindow({
  messages,
  onSendMessage,
  onFileUpload,
  pendingSuggestion,
  onApprove,
  onReject,
  onEdit
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingSuggestion])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Start updating your resume</p>
              <p className="text-sm">
                Share a professional update and I'll help you add it to your resume.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto py-4">
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
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
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

