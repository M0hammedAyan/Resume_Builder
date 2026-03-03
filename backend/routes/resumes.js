const express = require('express')
const {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume
} = require('../controllers/resumeController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.route('/')
  .post(createResume)
  .get(getResumes)

router.route('/:id')
  .get(getResume)
  .put(updateResume)
  .delete(deleteResume)

module.exports = router
