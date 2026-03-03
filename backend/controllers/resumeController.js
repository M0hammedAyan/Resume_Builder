const Resume = require('../models/Resume')

exports.createResume = async (req, res) => {
  try {
    const { title, content } = req.body

    const resume = await Resume.create({
      user: req.user.id,
      title,
      content
    })

    res.status(201).json({
      success: true,
      resume
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort('-createdAt')

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    res.status(200).json({
      success: true,
      resume
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.updateResume = async (req, res) => {
  try {
    const { title, content } = req.body

    let resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    resume.title = title || resume.title
    resume.content = content || resume.content
    await resume.save()

    res.status(200).json({
      success: true,
      resume
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted'
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
