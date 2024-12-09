const express = require('express');
const { verifyNFT } = require('../controllers/verifierController');
const router = express.Router();

router.post('/verify-nft', verifyNFT);

module.exports = router;
