'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getBreaches } = require('../controllers/breachController');

router.get('/', authenticate, getBreaches);

module.exports = router;
