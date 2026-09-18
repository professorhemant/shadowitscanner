'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { submit, list, review, workspaceInfo } = require('../controllers/approvalController');

// Public routes (no auth needed)
router.get('/workspace/:workspaceId', workspaceInfo);
router.post('/submit', submit);

// Authenticated IT routes
router.get('/', authenticate, list);
router.put('/:id/review', authenticate, review);

module.exports = router;
