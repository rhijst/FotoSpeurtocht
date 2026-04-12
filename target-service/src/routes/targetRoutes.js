const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const upload = require("../config/multer");

router.post('/', upload.single('image'), targetController.createTarget);

router.get('/', targetController.getTargets);
router.get('/search', targetController.getTargetsByLocation);

router.delete('/:id', targetController.deleteTarget);

module.exports = router;