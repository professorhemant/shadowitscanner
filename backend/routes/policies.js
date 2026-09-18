'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, create, update, remove, preview } = require('../controllers/policyController');

router.get('/', authenticate, list);
router.get('/preview', authenticate, preview);
router.post('/', authenticate, create);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
