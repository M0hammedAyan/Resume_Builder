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
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4">
        <div className="mx-auto max-w-3xl py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center text-slate-500">
                <p className="mb-2 text-lg font-semibold text-slate-900">Start updating your resume</p>
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

      <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <FileUpload onFileUpload={onFileUpload} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message CareerOS..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full bg-slate-900 p-2 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
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

