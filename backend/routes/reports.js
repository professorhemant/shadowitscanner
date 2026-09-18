'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generateReport } = require('../controllers/reportController');

router.get('/generate', authenticate, generateReport);

module.exports = router;
