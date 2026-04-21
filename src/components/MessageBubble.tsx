import { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user'

  return (
    <div className={`px-6 py-5 ${isUser ? 'bg-slate-50/80' : 'bg-white'}`}>
      <div className="mx-auto flex max-w-3xl gap-4">
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
              U
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              AI
            </div>
          )}
        </div>
        <div className="flex-1">
          {message.isFile ? (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-900">{message.content}</span>
            </div>
          ) : (
            <div className={`rounded-2xl px-5 py-4 ${
              isUser 
                ? 'border border-slate-200 bg-white shadow-sm' 
                : 'border border-slate-200 bg-slate-50'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
