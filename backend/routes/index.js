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

module.exports = router;
