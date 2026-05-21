const express = require('express');
const controller = require('./faq.controller');

const router = express.Router();

router.get('/faqs', controller.getPublicFaqs);
router.get('/site-settings', controller.getPublicSiteSettings);
router.get('/contact-info', controller.getPublicContactInfo);

module.exports = router;
