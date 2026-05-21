const express = require('express');
const controller = require('./faq.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', controller.listAdminFaqs);
router.post('/', controller.createAdminFaq);
router.patch('/:id', controller.updateAdminFaq);
router.delete('/:id', controller.deleteAdminFaq);

module.exports = router;
