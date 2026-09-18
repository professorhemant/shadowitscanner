'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', authenticate, getAnalytics);

module.exports = router;
