'use strict';

const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/workspaces', require('./workspaces'));
router.use('/scans', require('./scans'));
router.use('/apps', require('./apps'));
router.use('/dashboard', require('./dashboard'));
router.use('/alerts', require('./alerts'));
router.use('/cli', require('./cli'));
router.use('/demo', require('./demo'));
router.use('/nudges', require('./nudge'));
router.use('/approvals', require('./approvals'));
router.use('/spend', require('./spend'));
router.use('/reports', require('./reports'));
router.use('/breaches', require('./breaches'));
router.use('/offboarding', require('./offboarding'));
router.use('/extension', require('./extension'));
router.use('/sensitivity', require('./sensitivity'));
router.use('/vendor-risk', require('./vendorRisk'));
router.use('/slack-bot', require('./slackBot'));
router.use('/webhooks', require('./webhooks'));
router.use('/schedule', require('./schedule'));
router.use('/analytics', require('./analytics'));
router.use('/team', require('./team'));

module.exports = router;
