const express = require('express');
const controller = require('./support.controller');

const router = express.Router();

router.post('/contact', controller.createPublicContactMessage);

module.exports = router;
