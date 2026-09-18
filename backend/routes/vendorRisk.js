'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getVendorRisk } = require('../controllers/vendorRiskController');

router.get('/', authenticate, getVendorRisk);

module.exports = router;
