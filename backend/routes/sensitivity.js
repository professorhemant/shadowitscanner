'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getSensitivity } = require('../controllers/sensitivityController');

router.get('/', authenticate, getSensitivity);

module.exports = router;
