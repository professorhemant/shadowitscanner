'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, exportCsv, actionTypes } = require('../controllers/auditController');

router.use(authenticate);
router.get('/', list);
router.get('/export', exportCsv);
router.get('/action-types', actionTypes);

module.exports = router;
