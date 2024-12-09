const express = require('express');
const {
  addCredential,
  verifyCredential,
} = require('../controllers/employerController');
const router = express.Router();

router.post('/add-credential', addCredential);
router.post('/verify-credential', verifyCredential);

module.exports = router;
