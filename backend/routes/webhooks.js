'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, create, update, remove, test, deliveries } = require('../controllers/webhookController');

router.get('/', authenticate, list);
router.post('/', authenticate, create);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);
router.post('/:id/test', authenticate, test);
router.get('/:id/deliveries', authenticate, deliveries);

module.exports = router;
