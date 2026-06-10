const express = require('express');
const controller = require('./receipt.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/customer', authorize('CUSTOMER'), controller.listCustomerReceipts);
router.get('/customer/bookings/:bookingId', authorize('CUSTOMER'), controller.getCustomerReceiptByBooking);
router.get('/customer/:id', authorize('CUSTOMER'), controller.getCustomerReceiptById);
router.get('/customer/:id/download', authorize('CUSTOMER'), controller.downloadCustomerReceipt);

router.get('/admin', authorize('ADMIN'), controller.listAdminReceipts);
router.get('/admin/payments/:paymentId', authorize('ADMIN'), controller.getAdminReceiptByPayment);
router.get('/admin/:id', authorize('ADMIN'), controller.getAdminReceiptById);
router.get('/admin/:id/download', authorize('ADMIN'), controller.downloadAdminReceipt);

module.exports = router;
