const express = require('express');
const router = express.Router();
const ctrl = require('./location.controller');

router.get('/provinces', ctrl.getProvinces);
router.get('/districts', ctrl.getDistricts);
router.get('/municipalities', ctrl.getMunicipalities);

module.exports = router;