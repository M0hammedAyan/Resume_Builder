const improveBulletPoints = (bullets) => {
  return bullets.map(bullet => {
    let improved = bullet.trim()
    
    // Add action verbs if missing
    const actionVerbs = ['Developed', 'Implemented', 'Designed', 'Led', 'Managed', 'Created', 'Optimized', 'Achieved', 'Increased', 'Reduced']
    const startsWithActionVerb = actionVerbs.some(verb => improved.startsWith(verb))
    
    if (!startsWithActionVerb && improved.length > 0) {
      improved = `Developed ${improved.charAt(0).toLowerCase()}${improved.slice(1)}`
    }
    
    // Add metrics if missing
    if (!improved.match(/\d+%|\d+x|\$\d+/)) {
      improved = improved.replace(/improved|increased|reduced|enhanced/i, (match) => {
        return `${match} by 25%`
      })
    }
    
    // Ensure proper capitalization
    improved = improved.charAt(0).toUpperCase() + improved.slice(1)
    
    // Remove redundant words
    improved = improved.replace(/\b(very|really|just|actually)\b/gi, '')
    
    // Add period if missing
    if (!improved.endsWith('.')) {
      improved += '.'
    }
    
    return improved.trim()
  })
}

exports.improveResume = async (req, res) => {
  try {
    const { bullets, section } = req.body

    if (!bullets || !Array.isArray(bullets)) {
      return res.status(400).json({ error: 'Bullets array is required' })
    }

    if (bullets.length === 0) {
      return res.status(400).json({ error: 'At least one bullet point is required' })
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const improvedBullets = improveBulletPoints(bullets)

    res.status(200).json({
      success: true,
      original: bullets,
      improved: improvedBullets,
      section: section || 'general',
      tips: [
        'Use strong action verbs',
        'Include quantifiable metrics',
        'Keep it concise and clear',
        'Focus on achievements, not duties'
      ]
    })
  } catch (error) {
    console.error('Error improving resume:', error)
    res.status(500).json({ error: error.message })
  }
}

exports.improveFullSection = async (req, res) => {
  try {
    const { entries, section } = req.body

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries array is required' })
    }

    const improvedEntries = entries.map(entry => ({
      ...entry,
      bullets: entry.bullets ? improveBulletPoints(entry.bullets) : []
    }))

    res.status(200).json({
      success: true,
      improved: improvedEntries,
      section: section || 'general'
    })
  } catch (error) {
    console.error('Error improving section:', error)
    res.status(500).json({ error: error.message })
  }
}
