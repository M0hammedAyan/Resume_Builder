const analyzeATS = (content) => {
  const text = JSON.stringify(content).toLowerCase()
  
  // Keyword categories
  const technicalKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'java']
  const softSkills = ['leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'creative']
  const actionVerbs = ['developed', 'implemented', 'designed', 'led', 'managed', 'created', 'optimized', 'achieved', 'increased', 'reduced']
  
  // Detect keywords
  const foundTechnical = technicalKeywords.filter(kw => text.includes(kw))
  const foundSoft = softSkills.filter(kw => text.includes(kw))
  const foundActions = actionVerbs.filter(kw => text.includes(kw))
  
  // Calculate scores
  const keywordScore = Math.min(100, (foundTechnical.length + foundSoft.length) * 5)
  const actionVerbScore = Math.min(100, foundActions.length * 10)
  const hasMetrics = text.match(/\d+%|\d+x|\$\d+/g) || []
  const metricsScore = Math.min(100, hasMetrics.length * 15)
  
  // Readability
  const wordCount = text.split(/\s+/).length
  const readabilityScore = wordCount > 200 && wordCount < 800 ? 100 : 70
  
  // Overall score
  const overallScore = Math.round((keywordScore + actionVerbScore + metricsScore + readabilityScore) / 4)
  
  // Suggestions
  const suggestions = []
  if (foundTechnical.length < 5) suggestions.push('Add more technical skills')
  if (foundActions.length < 5) suggestions.push('Use more action verbs')
  if (hasMetrics.length < 3) suggestions.push('Include quantifiable achievements')
  if (foundSoft.length < 2) suggestions.push('Mention soft skills')
  
  return {
    overallScore,
    breakdown: {
      keywords: keywordScore,
      actionVerbs: actionVerbScore,
      metrics: metricsScore,
      readability: readabilityScore
    },
    found: {
      technical: foundTechnical,
      softSkills: foundSoft,
      actionVerbs: foundActions,
      metrics: hasMetrics.length
    },
    suggestions,
    missing: {
      technical: technicalKeywords.filter(kw => !foundTechnical.includes(kw)).slice(0, 5),
      softSkills: softSkills.filter(kw => !foundSoft.includes(kw)).slice(0, 3)
    }
  }
}

exports.scoreResume = async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Resume content is required' })
    }

    const analysis = analyzeATS(content)

    res.status(200).json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('Error scoring resume:', error)
    res.status(500).json({ error: error.message })
  }
}
