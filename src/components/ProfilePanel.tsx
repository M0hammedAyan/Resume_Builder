import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Profile, ResumeEntry } from '../types'

interface ProfilePanelProps {
  profile: Profile
  onPreviewResume: () => void
  onReorder: (section: keyof Profile, items: ResumeEntry[]) => void
}

function ProfilePanel({ profile, onPreviewResume, onReorder }: ProfilePanelProps) {
  const handleDragEnd = (result: DropResult, section: keyof Profile) => {
    if (!result.destination) return

    const items = Array.from(profile[section] as ResumeEntry[])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onReorder(section, items)
  }

  const sections = [
    { key: 'education' as keyof Profile, title: 'Education', icon: '🎓', color: 'bg-blue-50 border-blue-200' },
    { key: 'experience' as keyof Profile, title: 'Experience', icon: '💼', color: 'bg-green-50 border-green-200' },
    { key: 'projects' as keyof Profile, title: 'Projects', icon: '🚀', color: 'bg-purple-50 border-purple-200' },
    { key: 'skills' as keyof Profile, title: 'Skills', icon: '⚡', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'achievements' as keyof Profile, title: 'Achievements', icon: '🏆', color: 'bg-orange-50 border-orange-200' }
  ]

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Resume</h2>
        <p className="text-sm text-gray-500 mb-4">Drag to reorder items</p>
        <button
          onClick={onPreviewResume}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Preview Resume
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sections.map(section => {
          const items = profile[section.key] as ResumeEntry[]
          if (items.length === 0) return null

          return (
            <div key={section.key} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  {section.title}
                  <span className="ml-auto text-xs font-normal text-gray-500">{items.length}</span>
                </h3>
              </div>

              <DragDropContext onDragEnd={(result) => handleDragEnd(result, section.key)}>
                <Droppable droppableId={section.key}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                    >
                      {items.map((item, idx) => (
                        <Draggable key={`${section.key}-${idx}`} draggableId={`${section.key}-${idx}`} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 rounded-xl border-2 transition-all ${
                                snapshot.isDragging
                                  ? 'border-purple-400 bg-purple-50 shadow-lg'
                                  : `${section.color} hover:shadow-md`
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )
        })}

        {sections.every(s => (profile[s.key] as ResumeEntry[]).length === 0) && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No entries yet</p>
            <p className="text-xs text-gray-400 mt-1">Start adding updates to build your resume</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePanel
