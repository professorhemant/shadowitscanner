'use strict';

const router = require('express').Router();
const { create, list, revoke } = require('../controllers/apiKeyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', create);
router.get('/', list);
router.delete('/:id', revoke);

module.exports = router;
