'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, send } = require('../controllers/nudgeController');

router.get('/', authenticate, list);
router.post('/send', authenticate, send);

module.exports = router;
