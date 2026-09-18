'use strict';

const router = require('express').Router();
const { seedDemo } = require('../controllers/demoController');
const { authenticate } = require('../middleware/auth');

router.post('/seed', authenticate, seedDemo);

module.exports = router;
