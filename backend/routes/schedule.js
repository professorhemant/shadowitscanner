'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getSchedule, updateSchedule } = require('../controllers/scheduleController');

router.get('/', authenticate, getSchedule);
router.put('/:workspace_id', authenticate, updateSchedule);

module.exports = router;
