const express = require('express');
const controller = require('./support.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/support/messages', controller.listAdminSupportMessages);
router.get('/support/messages/:id', controller.getAdminSupportMessageById);
router.get('/support/stats', controller.getAdminSupportStats);
router.patch('/support/messages/:id/status', controller.updateAdminSupportStatus);
router.patch('/support/messages/:id/resolve', controller.resolveAdminSupportMessage);

module.exports = router;
