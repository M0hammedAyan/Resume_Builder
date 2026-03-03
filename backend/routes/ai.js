const express = require('express')
const { improveResume, improveFullSection } = require('../controllers/aiController')
const { scoreResume } = require('../controllers/atsController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.post('/improve-bullets', improveResume)
router.post('/improve-section', improveFullSection)
router.post('/score-resume', scoreResume)

module.exports = router
