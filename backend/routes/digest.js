'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getSettings, updateSettings, sendTest, previewData } = require('../controllers/digestController');

router.use(authenticate);
router.get('/',         getSettings);
router.put('/',         updateSettings);
router.post('/test',    sendTest);
router.get('/preview',  previewData);

module.exports = router;
