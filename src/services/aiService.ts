const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const improveBulletPoints = async (bullets: string[], section?: string, token?: string) => {
  try {
    const response = await fetch(`${API_URL}/ai/improve-bullets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ bullets, section })
    })

    if (!response.ok) {
      throw new Error('Failed to improve bullet points')
    }

    return await response.json()
  } catch (error) {
    console.error('Error improving bullets:', error)
    throw error
  }
}

export const improveSection = async (entries: any[], section: string, token?: string) => {
  try {
    const response = await fetch(`${API_URL}/ai/improve-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ entries, section })
    })

    if (!response.ok) {
      throw new Error('Failed to improve section')
    }

    return await response.json()
  } catch (error) {
    console.error('Error improving section:', error)
    throw error
  }
}
