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
    suggestion = {
      category: 'Project',
      resumeEntry: {
        title: extractProjectName(userMessage),
        description: extractDescription(userMessage),
        bullets: [
          `Developed ${extractProjectName(userMessage)} using modern technologies`,
          `Implemented key features that improved ${extractBenefit(userMessage)}`,
          `Collaborated with team members to deliver project on time`
        ]
      },
      resumeBullets: [
        `Developed ${extractProjectName(userMessage)} using modern technologies`,
        `Implemented key features that improved ${extractBenefit(userMessage)}`
      ],
      data: {
        title: extractProjectName(userMessage),
        description: extractDescription(userMessage),
        bullets: [
          `Developed ${extractProjectName(userMessage)} using modern technologies`,
          `Implemented key features that improved ${extractBenefit(userMessage)}`
        ]
      }
    }
  } else if (message.includes('skill') || message.includes('learned') || message.includes('certified')) {
    category = 'Skill'
    suggestion = {
      category: 'Skill',
      resumeEntry: {
        title: extractSkill(userMessage),
        description: `Proficient in ${extractSkill(userMessage)} with hands-on experience`
      },
      resumeBullets: [
        `Proficient in ${extractSkill(userMessage)}`,
        `Certified in ${extractSkill(userMessage)} with hands-on experience`
      ],
      data: extractSkill(userMessage)
    }
  } else if (
    message.includes('graduated') || 
    message.includes('degree') || 
    message.includes('university') ||
    message.includes('studied') ||
    message.includes('completed my education') ||
    message.includes('completed education') ||
    message.includes('bachelor') ||
    message.includes('master') ||
    message.includes('phd') ||
    message.includes('diploma') ||
    message.includes('college')
  ) {
    category = 'Education'
    suggestion = {
      category: 'Education',
      resumeEntry: {
        title: extractEducation(userMessage),
        description: 'Completed with dedication and excellence'
      },
      resumeBullets: [
        `Earned ${extractEducation(userMessage)}`,
        `Completed coursework in relevant field with strong academic performance`
      ],
      data: {
        title: extractEducation(userMessage),
        description: 'Completed with dedication and excellence'
      }
    }
  } else if (message.includes('award') || message.includes('achievement') || message.includes('recognition')) {
    category = 'Achievement'
    suggestion = {
      category: 'Achievement',
      resumeEntry: {
        title: extractAchievement(userMessage),
        description: `Recognized for ${extractAchievement(userMessage)}`
      },
      resumeBullets: [
        `Recognized for ${extractAchievement(userMessage)}`,
        `Demonstrated excellence in professional endeavors`
      ],
      data: extractAchievement(userMessage)
    }
  } else {
    // Default to Experience
    suggestion = {
      category: 'Experience',
      resumeEntry: {
        title: extractExperience(userMessage),
        description: userMessage,
        bullets: [
          `Worked on ${extractExperience(userMessage)}`,
          `Delivered results in professional capacity`,
          `Collaborated effectively with team members`
        ]
      },
      resumeBullets: [
        `Worked on ${extractExperience(userMessage)}`,
        `Delivered results in professional capacity`
      ],
      data: {
        title: extractExperience(userMessage),
        description: userMessage,
        bullets: [
          `Worked on ${extractExperience(userMessage)}`,
          `Delivered results in professional capacity`
        ]
      }
    }
  }

  return {
    message: `I detected this as a ${category} update. Would you like to add it to your resume?`,
    suggestion
  }
}

// Helper functions to extract information from user messages
function extractProjectName(message) {
  const projectMatch = message.match(/(?:project|built|developed)\s+(?:on|about|for)?\s*([^.]+)/i)
  if (projectMatch) return projectMatch[1].trim()
  return 'a new project'
}

function extractBenefit(message) {
  if (message.includes('efficiency')) return 'operational efficiency'
  if (message.includes('accuracy')) return 'data accuracy'
  if (message.includes('speed')) return 'processing speed'
  return 'overall performance'
}

function extractDescription(message) {
  // Return a cleaned version of the message
  return message.charAt(0).toUpperCase() + message.slice(1) + '.'
}

function extractSkill(message) {
  const skillMatch = message.match(/(?:learned|skill|certified|proficient in)\s+([^.]+)/i)
  if (skillMatch) return skillMatch[1].trim()
  
  // Try to find common tech terms
  const techTerms = ['python', 'javascript', 'react', 'machine learning', 'data science', 'cloud computing']
  for (const term of techTerms) {
    if (message.includes(term)) return term
  }
  
  return 'new skills'
}

function extractEducation(message) {
  const eduMatch = message.match(/(?:graduated|degree|completed|earned)\s+([^.]+)/i)
  if (eduMatch) return eduMatch[1].trim()
  return 'my degree'
}

function extractAchievement(message) {
  const achMatch = message.match(/(?:award|achievement|recognition|won)\s+([^.]+)/i)
  if (achMatch) return achMatch[1].trim()
  return 'professional excellence'
}

function extractExperience(message) {
  // Try to extract the main topic
  const words = message.split(' ').slice(0, 5).join(' ')
  return words || 'professional work'
}

