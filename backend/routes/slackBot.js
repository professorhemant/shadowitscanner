'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getConfig, configure, testWebhook, sendNow } = require('../controllers/slackBotController');

router.get('/config', authenticate, getConfig);
router.post('/configure', authenticate, configure);
router.post('/test', authenticate, testWebhook);
router.post('/send-now', authenticate, sendNow);

module.exports = router;
