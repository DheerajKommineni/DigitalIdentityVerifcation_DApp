const express = require('express');
const {
  uploadResume,
  fetchCredentials,
} = require('../controllers/applicantController');
const router = express.Router();

router.post('/upload-resume', uploadResume);
router.get('/credentials/:applicantId', fetchCredentials);

module.exports = router;
