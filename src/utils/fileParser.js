/**
 * File Parser Utilities
 * 
 * Functions to extract text content from PDF and Word documents
 * Used to import existing resumes/CVs into the profile
 */

/**
 * Extracts text content from a PDF file
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text content
 */
export async function parsePDF(file) {
  try {
    // Use dynamic import with proper path for Vite
    // Import the main module
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source using CDN (required for pdfjs-dist)
    if (typeof window !== 'undefined') {
      // Use a fixed version for the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
    }
    
    const arrayBuffer = await file.arrayBuffer()
    
    // Use getDocument from the imported library
    const { getDocument } = pdfjsLib
    const pdf = await getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true 
    }).promise
    
    let fullText = ''
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText.trim()
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error(`Failed to parse PDF file: ${error.message}. Please ensure it is a valid PDF.`)
  }
}

/**
 * Extracts text content from a Word document (.docx)
 * @param {File} file - Word document file object
 * @returns {Promise<string>} Extracted text content
 */
export async function parseWord(file) {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
  } catch (error) {
    console.error('Error parsing Word document:', error)
    throw new Error('Failed to parse Word document. Please ensure it is a valid .docx file.')
  }
}

/**
 * Parses a file based on its type
 * @param {File} file - File object to parse
 * @returns {Promise<string>} Extracted text content
 */
export async function parseFile(file) {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await parsePDF(file)
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return await parseWord(file)
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or .docx file.')
  }
}

/**
 * Processes extracted text and creates a structured suggestion
 * This simulates AI analysis of the document content
 * @param {string} text - Extracted text from document
 * @param {string} fileName - Original file name
 * @returns {Object} Suggestion object ready for display
 */
export function processDocumentContent(text, fileName) {
  // Simple parsing to extract sections (in a real app, this would use AI)
  const lines = text.split('\n').filter(line => line.trim())
  
  // Try to identify sections
  const sections = {
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: []
  }
  
  let currentSection = null
  const sectionKeywords = {
    education: ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'],
    experience: ['experience', 'work', 'employment', 'position', 'role', 'job'],
    projects: ['project', 'portfolio', 'developed', 'built', 'created'],
    skills: ['skill', 'technical', 'proficiency', 'expertise', 'competent'],
    achievements: ['achievement', 'award', 'recognition', 'honor', 'certification']
  }
  
  // Simple section detection
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Check if line is a section header
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword) && line.length < 50)) {
        currentSection = section
        break
      }
    }
    
    // Add content to current section
    if (currentSection && line.trim().length > 10) {
      sections[currentSection].push(line.trim())
    }
  }
  
  // Create suggestion for importing the entire document
  return {
    category: 'Document Import',
    source: fileName,
    resumeEntry: {
      title: `Imported from ${fileName}`,
      description: `Document contains ${lines.length} lines of professional information`,
      bullets: [
        `Imported content from ${fileName}`,
        'Review and approve to add to your resume'
      ]
    },
    resumeBullets: [
      `Imported content from ${fileName}`,
      `Document contains ${lines.length} lines of professional information`,
      'Review and approve to add to your resume'
    ],
    data: {
      fileName,
      rawText: text,
      sections,
      importedAt: new Date().toISOString()
    },
    isDocumentImport: true
  }
}

