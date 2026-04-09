const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { scoreByUrl, scoreByUpload } = require('../controllers/scoreController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Score image by URL
router.post('/url', authMiddleware, express.json(), scoreByUrl);

// Score image by file upload
router.post('/upload', authMiddleware, upload.single('image'), scoreByUpload);

module.exports = router;
