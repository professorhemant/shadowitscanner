'use strict';

const router = require('express').Router();
const { register, login, me, changePassword, adminReset } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);
router.post('/admin-reset', adminReset);

module.exports = router;
