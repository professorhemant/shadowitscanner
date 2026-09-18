'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { invite, listMembers, revoke, listInvites, acceptInvite } = require('../controllers/teamController');

router.post('/invite', authenticate, invite);
router.get('/invites', authenticate, listInvites);
router.post('/accept', authenticate, acceptInvite);
router.get('/:workspace_id', authenticate, listMembers);
router.delete('/:id', authenticate, revoke);

module.exports = router;
