import { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user'

  return (
    <div className={`px-6 py-6 ${isUser ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              U
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              AI
            </div>
          )}
        </div>
        <div className="flex-1">
          {message.isFile ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">{message.content}</span>
            </div>
          ) : (
            <div className={`px-5 py-4 rounded-2xl ${
              isUser 
                ? 'bg-white border-2 border-gray-200 shadow-sm' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
            }`}>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
