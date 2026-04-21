import { useState } from 'react'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

function FileUpload({ onFileUpload, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isValidType = 
      file.type === 'application/pdf' ||
      fileName.endsWith('.pdf') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')

    if (!isValidType) {
      alert('Please upload a PDF or .docx file only.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.')
      return
    }

    try {
      await onFileUpload(file)
    } catch (error) {
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${isDragging ? 'opacity-75' : ''}`}
    >
      <input
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer text-slate-400 transition hover:text-slate-700 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </label>
    </div>
  )
}

export default FileUpload
