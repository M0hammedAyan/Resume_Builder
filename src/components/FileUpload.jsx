import { useState } from 'react'

/**
 * FileUpload Component
 * 
 * Allows users to upload PDF or Word documents
 * Displays upload button and handles file selection
 */
function FileUpload({ onFileUpload, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (files) => {
    const file = files[0]
    if (!file) return

    // Validate file type
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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.')
      return
    }

    try {
      await onFileUpload(file)
    } catch (error) {
      alert(`Error processing file: ${error.message}`)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files)
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
        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span className="text-sm text-gray-700">
          Upload PDF/Word
        </span>
      </label>
    </div>
  )
}

export default FileUpload

