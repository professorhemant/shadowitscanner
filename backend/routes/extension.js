'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { report, getStats } = require('../controllers/extensionController');

router.post('/report', authenticate, report);
router.get('/stats', authenticate, getStats);

module.exports = router;
