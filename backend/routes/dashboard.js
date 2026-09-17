'use strict';

const router = require('express').Router();
const { stats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, stats);

module.exports = router;
