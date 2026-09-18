'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getChecklist } = require('../controllers/offboardingController');

router.get('/checklist', authenticate, getChecklist);

module.exports = router;
