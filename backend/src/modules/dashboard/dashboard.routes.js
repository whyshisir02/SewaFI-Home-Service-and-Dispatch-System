const express = require('express');
const router = express.Router();
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

router.get('/summary', ctrl.getSummary);

module.exports = router;
