'use strict';

const router = require('express').Router();
const { upload } = require('../controllers/cliController');
const { authenticate } = require('../middleware/auth');

router.post('/upload', authenticate, upload);

module.exports = router;
