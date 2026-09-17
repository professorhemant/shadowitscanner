'use strict';

const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/workspaces', require('./workspaces'));
router.use('/scans', require('./scans'));
router.use('/apps', require('./apps'));
router.use('/dashboard', require('./dashboard'));
router.use('/alerts', require('./alerts'));
router.use('/cli', require('./cli'));
router.use('/admin', require('./admin'));

module.exports = router;
