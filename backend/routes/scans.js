'use strict';

const router = require('express').Router();
const { triggerScan, history, getStatus } = require('../controllers/scanController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/trigger', triggerScan);
router.get('/history', history);
router.get('/:id', getStatus);

module.exports = router;
