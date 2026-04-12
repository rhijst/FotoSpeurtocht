const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/verify', authController.verify);
router.post('/register', authController.register);
router.get('/users/:userId', authController.getUserById);

module.exports = router;