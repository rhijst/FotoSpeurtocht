const express = require('express');
const multer = require('multer');
const { scoreByUpload } = require('../controllers/scoreController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Score image by file upload
router.post('/upload', upload.single('image'), scoreByUpload);

module.exports = router;
