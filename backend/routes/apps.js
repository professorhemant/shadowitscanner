'use strict';

const router = require('express').Router();
const { list, getDetail, whitelist, removeWhitelist, exportCsv, bulkAction } = require('../controllers/appController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', list);
router.get('/export', exportCsv);
router.post('/bulk-action', bulkAction);
router.get('/:id', getDetail);
router.post('/:id/whitelist', whitelist);
router.delete('/:id/whitelist', removeWhitelist);

module.exports = router;
