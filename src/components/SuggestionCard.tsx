import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Suggestion } from '../types'
import { resumeEntrySchema, ResumeEntryInput } from '../schemas/resumeSchemas'

interface SuggestionCardProps {
  suggestion: Suggestion
  onApprove: (suggestion: Suggestion) => void
  onReject: () => void
  onEdit: () => void
}

function SuggestionCard({ suggestion, onApprove, onReject }: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResumeEntryInput>({
    resolver: zodResolver(resumeEntrySchema),
    defaultValues: {
      title: suggestion.resumeEntry?.title || '',
      description: suggestion.resumeEntry?.description || '',
      bullets: suggestion.resumeEntry?.bullets || []
    }
  })

  const [editedSection, setEditedSection] = useState(suggestion.category || '')

  const onSubmit = (data: ResumeEntryInput) => {
    const editedSuggestion: Suggestion = {
      ...suggestion,
      category: editedSection,
      resumeEntry: data,
      data: { ...suggestion.data, ...data }
    }
    onApprove(editedSuggestion)
    setIsEditing(false)
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full">
              {suggestion.category}
            </span>
            <span className="text-white/90 text-sm font-medium">AI Suggestion</span>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>

      {suggestion.resumeEntry && (
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={editedSection}
                  onChange={(e) => setEditedSection(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="Education">Education</option>
                  <option value="Experience">Experience</option>
                  <option value="Projects">Projects</option>
                  <option value="Skills">Skills</option>
                  <option value="Achievements">Achievements</option>
                  <option value="Patents">Patents</option>
                  <option value="Certifications">Certifications</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Save & Add to Resume
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                {suggestion.resumeEntry.title && (
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{suggestion.resumeEntry.title}</h3>
                )}
                {suggestion.resumeEntry.description && (
                  <p className="text-sm text-gray-600 mb-3">{suggestion.resumeEntry.description}</p>
                )}
                {suggestion.resumeEntry.bullets && suggestion.resumeEntry.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {suggestion.resumeEntry.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => onApprove(suggestion)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Add to Resume
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={onReject}
                  className="px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-all"
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SuggestionCard
