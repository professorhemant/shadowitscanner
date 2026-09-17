'use strict';

const router = require('express').Router();
const { getConfig, updateConfig } = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/:workspace_id', getConfig);
router.put('/:workspace_id', updateConfig);

module.exports = router;
