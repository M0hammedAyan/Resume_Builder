import { AIResponse, Suggestion, ResumeEntry } from '../types'

export async function mockAIResponse(userMessage: string): Promise<AIResponse> {
  const message = userMessage.toLowerCase()
  await new Promise(resolve => setTimeout(resolve, 500))

  let category = 'Experience'
  let suggestion: Suggestion | null = null

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
      data: { title: skills.join(', ') }
    }
  } else if (message.includes('patent') || message.includes('publication')) {
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
  } else if (message.includes('certificate') || message.includes('certification')) {
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
  } else if (message.includes('graduated') || message.includes('degree') || message.includes('university')) {
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
  } else if (message.includes('award') || message.includes('achievement')) {
    category = 'Achievement'
    const achievement = extractAchievement(userMessage)
    suggestion = {
      category: 'Achievement',
      resumeEntry: {
        title: achievement
      },
      data: { title: achievement }
    }
  } else {
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

function extractProject(message: string): ResumeEntry {
  const parts = message.split(/[-–—]/)
  let title = 'Project'
  let description = message

  if (parts.length >= 2) {
    title = parts[0].trim()
    description = parts.slice(1).join('-').trim()
  }

  return { title, description }
}

function extractSkills(message: string): string[] {
  const skillKeywords = ['python', 'javascript', 'react', 'java', 'c++', 'machine learning']
  const found = skillKeywords.filter(skill => message.toLowerCase().includes(skill))
  return found.length > 0 ? found : [message.trim()]
}

function extractEducation(message: string): ResumeEntry {
  const courseMatch = message.match(/(?:BE|BTech|Bachelor|Master|PhD)\\s+(?:in\\s+)?([A-Za-z\\s&]+)/i)
  const collegeMatch = message.match(/(?:from|at)\\s+([A-Za-z\\s.]+)/i)
  
  return {
    title: courseMatch?.[0].trim() || 'Degree',
    description: collegeMatch?.[1].trim() || 'College'
  }
}

function extractExperience(message: string): ResumeEntry {
  const companyMatch = message.match(/(?:at|in|with)\\s+([A-Z][A-Za-z\\s.&]+)/i)
  const positionMatch = message.match(/(?:as|position)[:\\s]+([^,\\.]+)/i)
  
  return {
    title: positionMatch?.[1].trim() || 'Position',
    description: companyMatch?.[1].trim() || message
  }
}

function extractPatent(message: string): ResumeEntry {
  const yearMatch = message.match(/(\\d{4})/)
  const titleMatch = message.match(/^([^\\(\\d]+)/)
  
  return {
    title: titleMatch?.[1].trim() || message,
    description: yearMatch?.[1] || ''
  }
}

function extractCertification(message: string): ResumeEntry {
  const parts = message.split(/[-–—]/)
  return {
    title: parts[1]?.trim() || message,
    description: parts[0]?.trim() || 'Source'
  }
}

function extractAchievement(message: string): string {
  const achMatch = message.match(/(?:award|achievement)[:\\s]+([^.]+)/i)
  return achMatch?.[1].trim() || message.trim()
}
