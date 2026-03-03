const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Resume title is required'],
    trim: true
  },
  content: {
    type: Object,
    required: true,
    default: {
      education: [],
      experience: [],
      projects: [],
      skills: [],
      achievements: [],
      patents: [],
      certifications: []
    }
  }
}, {
  timestamps: true
})

resumeSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Resume', resumeSchema)
