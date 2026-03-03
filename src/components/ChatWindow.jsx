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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
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

        {/* Show pending suggestion after AI response */}
        {pendingSuggestion && (
          <SuggestionCard
            suggestion={pendingSuggestion}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-center">
            <FileUpload onFileUpload={onFileUpload} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a professional update for your resume..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow

