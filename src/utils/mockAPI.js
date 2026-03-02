/**
 * Mock API Functions
 * 
 * Simulates backend AI responses
 * In a real application, these would call actual Ollama endpoints
 */

/**
 * Analyzes user message and generates AI response with suggestion
 * Uses simple keyword matching for demonstration
 */
export async function mockAIResponse(userMessage) {
  const message = userMessage.toLowerCase()

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Detect category based on keywords
  let category = 'Experience'
  let suggestion = null

  if (message.includes('project') || message.includes('built') || message.includes('developed')) {
    category = 'Project'
    const projectData = extractProject(userMessage)
    suggestion = {
      category: 'Project',
      resumeEntry: {
        title: projectData.title,
        description: projectData.description
      },
      data: projectData
    }
  } else if (message.includes('skill')) {
    category = 'Skill'
    const skills = extractSkills(userMessage)
    suggestion = {
      category: 'Skill',
      resumeEntry: {
        title: skills.join(', ')
      },
      data: skills
    }
  } else if (message.includes('patent') || message.includes('publication') || message.includes('published') || message.includes('paper')) {
    category = 'Patent'
    const patentData = extractPatent(userMessage)
    suggestion = {
      category: 'Patent',
      resumeEntry: {
        title: patentData.title,
        description: patentData.year
      },
      data: patentData
    }
  } else if (message.includes('certificate') || message.includes('certification') || message.includes('certified')) {
    category = 'Certification'
    const certData = extractCertification(userMessage)
    suggestion = {
      category: 'Certification',
      resumeEntry: {
        title: certData.title,
        description: certData.source
      },
      data: certData
    }
  } else if (
    message.includes('graduated') || 
    message.includes('degree') || 
    message.includes('university') ||
    message.includes('studied') ||
    message.includes('bachelor') ||
    message.includes('master') ||
    message.includes('phd') ||
    message.includes('diploma') ||
    message.includes('college') ||
    message.includes('be ') || message.includes('b.e') ||
    message.includes('btech') || message.includes('b.tech')
  ) {
    category = 'Education'
    const eduData = extractEducation(userMessage)
    suggestion = {
      category: 'Education',
      resumeEntry: {
        title: eduData.course,
        description: `${eduData.college} | ${eduData.duration}`
      },
      data: eduData
    }
  } else if (message.includes('award') || message.includes('achievement') || message.includes('recognition')) {
    category = 'Achievement'
    suggestion = {
      category: 'Achievement',
      resumeEntry: {
        title: extractAchievement(userMessage)
      },
      data: extractAchievement(userMessage)
    }
  } else if (message.includes('intern') || message.includes('work') || message.includes('job') || message.includes('company') || message.includes('experience')) {
    category = 'Experience'
    const expData = extractExperience(userMessage)
    suggestion = {
      category: 'Experience',
      resumeEntry: {
        title: expData.position,
        description: `${expData.company} | ${expData.description}`
      },
      data: expData
    }
  } else {
    // Default to Experience
    const expData = extractExperience(userMessage)
    suggestion = {
      category: 'Experience',
      resumeEntry: {
        title: expData.position,
        description: `${expData.company} | ${expData.description}`
      },
      data: expData
    }
  }

  return {
    message: `I detected this as a ${category} update. Would you like to add it to your resume?`,
    suggestion
  }
}

// Helper functions to extract information from user messages

function extractProject(message) {
  const parts = message.split(/[-–—]/)
  let title = 'Project'
  let description = message

  if (parts.length >= 2) {
    title = parts[0].trim()
    description = parts.slice(1).join('-').trim()
  } else {
    const match = message.match(/(?:project|built|developed)\s+(?:on|about|for)?\s*([^.,:]+)/i)
    if (match) title = match[1].trim()
  }

  return { title, description }
}

function extractSkills(message) {
  const skillKeywords = ['python', 'javascript', 'react', 'java', 'c++', 'machine learning', 'ai', 'data science', 'aws', 'docker', 'kubernetes']
  const found = []
  
  skillKeywords.forEach(skill => {
    if (message.toLowerCase().includes(skill)) found.push(skill)
  })

  if (found.length === 0) {
    const match = message.match(/skill[s]?[:\s]+([^.]+)/i)
    if (match) return match[1].split(/,|and/).map(s => s.trim())
    return [message.trim()]
  }
  
  return found
}

function extractEducation(message) {
  let course = ''
  let college = ''
  let duration = ''

  // Extract course
  const courseMatch = message.match(/(?:BE|B\.E|BTech|B\.Tech|ME|M\.E|MTech|M\.Tech|Bachelor|Master|PhD)\s+(?:in\s+)?([A-Za-z\s&]+?)(?:,|from|at|in|\d)/i)
  if (courseMatch) {
    course = courseMatch[0].trim()
  }

  // Extract college
  const collegeMatch = message.match(/(?:from|at|in)\s+([A-Za-z\s.]+?)(?:,|\d|from|\(|$)/i)
  if (collegeMatch) {
    college = collegeMatch[1].trim()
  } else {
    const instituteMatch = message.match(/([A-Z][A-Za-z\s.]+(?:Institute|University|College)[A-Za-z\s.]*)/i)
    if (instituteMatch) college = instituteMatch[1].trim()
  }

  // Extract duration
  const durationMatch = message.match(/(\d{4})\s*(?:to|-|–)\s*(\d{4}|present)/i)
  if (durationMatch) {
    duration = `${durationMatch[1]} - ${durationMatch[2]}`
  }

  return {
    course: course || 'Degree',
    college: college || 'College',
    duration: duration || 'Duration'
  }
}

function extractExperience(message) {
  let company = ''
  let position = ''
  let description = message

  // Extract company
  const companyMatch = message.match(/(?:at|in|with|@)\s+([A-Z][A-Za-z\s.&]+?)(?:,|as|\.|$)/i)
  if (companyMatch) {
    company = companyMatch[1].trim()
  }

  // Extract position
  const positionMatch = message.match(/(?:as|position|role|title)[:\s]+([^,\.]+)/i)
  if (positionMatch) {
    position = positionMatch[1].trim()
  } else {
    const roleMatch = message.match(/(?:intern|engineer|developer|manager|lead|designer|analyst|consultant)/i)
    if (roleMatch) position = roleMatch[0]
  }

  return {
    company: company || 'Company',
    position: position || 'Position',
    description: description
  }
}

function extractPatent(message) {
  const parts = message.split(/\(|\)|\d{4}/)
  let title = message
  let year = ''

  const yearMatch = message.match(/(\d{4})/)
  if (yearMatch) year = yearMatch[1]

  const titleMatch = message.match(/^([^\(\d]+)/)
  if (titleMatch) title = titleMatch[1].trim()

  return { title, year }
}

function extractCertification(message) {
  let title = ''
  let source = ''

  const parts = message.split(/[-–—]/)
  if (parts.length >= 2) {
    source = parts[0].trim()
    title = parts.slice(1).join('-').trim()
  } else {
    const sourceMatch = message.match(/(?:from|by|at)\s+([^,\.]+)/i)
    if (sourceMatch) source = sourceMatch[1].trim()
    title = message.replace(sourceMatch?.[0] || '', '').trim()
  }

  return { title: title || message, source: source || 'Source' }
}

function extractAchievement(message) {
  const achMatch = message.match(/(?:award|achievement|recognition|won)[:\s]+([^.]+)/i)
  if (achMatch) return achMatch[1].trim()
  return message.trim()
}

