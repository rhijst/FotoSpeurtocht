const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require("../config/multer");

router.post('/', authMiddleware, upload.single('image'), targetController.createTarget);

router.get('/', targetController.getTargets);

router.delete('/:id', authMiddleware, targetController.deleteTarget);

module.exports = router;