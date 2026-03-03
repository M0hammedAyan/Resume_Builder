import { useState } from 'react'
import { improveBulletPoints } from '../services/aiService'

interface AIImproveButtonProps {
  bullets: string[]
  section?: string
  onImproved: (improvedBullets: string[]) => void
}

function AIImproveButton({ bullets, section, onImproved }: AIImproveButtonProps) {
  const [isImproving, setIsImproving] = useState(false)

  const handleImprove = async () => {
    if (bullets.length === 0) {
      alert('No bullet points to improve')
      return
    }

    setIsImproving(true)
    try {
      const result = await improveBulletPoints(bullets, section)
      onImproved(result.improved)
    } catch (error) {
      alert('Failed to improve bullet points. Please try again.')
    } finally {
      setIsImproving(false)
    }
  }

  return (
    <button
      onClick={handleImprove}
      disabled={isImproving || bullets.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {isImproving ? 'Improving...' : 'AI Improve'}
    </button>
  )
}

export default AIImproveButton
