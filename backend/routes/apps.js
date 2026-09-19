'use strict';

const router = require('express').Router();
const { list, getDetail, whitelist, removeWhitelist, exportCsv } = require('../controllers/appController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', list);
router.get('/export', exportCsv);
router.get('/:id', getDetail);
router.post('/:id/whitelist', whitelist);
router.delete('/:id/whitelist', removeWhitelist);

module.exports = router;
