'use strict';

const router = require('express').Router();
const { list, create, update, remove } = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
