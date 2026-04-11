const express = require('express');
const multer = require('multer');
const { scoreByUrl, scoreByUpload } = require('../controllers/scoreController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Score image by URL
router.post('/url', express.json(), scoreByUrl);

// Score image by file upload
router.post('/upload', upload.single('image'), scoreByUpload);

module.exports = router;
