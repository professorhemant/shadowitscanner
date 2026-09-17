'use strict';

const router = require('express').Router();
const { list, whitelist, removeWhitelist } = require('../controllers/appController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', list);
router.post('/:id/whitelist', whitelist);
router.delete('/:id/whitelist', removeWhitelist);

module.exports = router;
