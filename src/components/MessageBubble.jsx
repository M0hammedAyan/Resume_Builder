function MessageBubble({ message }) {
  const isUser = message.type === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end py-4 px-6">
        <div className="max-w-2xl bg-[#343541] text-white rounded-lg px-4 py-3">
          {message.isFile && (
            <div className="flex items-center gap-2 mb-2 text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs">{message.fileName}</span>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#444654] py-6">
      <div className="max-w-3xl mx-auto w-full flex gap-4 px-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
          AI
        </div>
        <div className="flex-1 text-white">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble

