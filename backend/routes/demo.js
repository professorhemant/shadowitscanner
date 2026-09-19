'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { seedDemo, demoLogin } = require('../controllers/demoController');
const { authenticate } = require('../middleware/auth');

const demoLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many demo requests' } });

router.post('/login', demoLimiter, demoLogin);
router.post('/seed', authenticate, seedDemo);

module.exports = router;
