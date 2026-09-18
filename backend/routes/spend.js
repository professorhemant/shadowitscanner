'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getSpend } = require('../controllers/spendController');

router.get('/', authenticate, getSpend);

module.exports = router;
