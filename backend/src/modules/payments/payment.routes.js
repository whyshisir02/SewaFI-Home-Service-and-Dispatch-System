const express = require('express');
const { authenticate, authorize, requireApprovedProvider } = require('../../middlewares/auth.middleware');
const controller = require('./payment.controller');
const ApiResponse = require('../../utils/ApiResponse');

const router = express.Router();

router.use(authenticate);

router.get('/methods', (req, res) => {
  res.json(
    new ApiResponse(200, ['CASH', 'MANUAL', 'BANK_TRANSFER'], 'Manual payment methods fetched')
  );
});

router.get('/booking/:bookingId', authorize('CUSTOMER'), controller.getCustomerBookingPayment);
router.get('/customer/list', authorize('CUSTOMER'), controller.listCustomerPayments);

router.post('/initiate', authorize('CUSTOMER'), (req, res) => {
  res.status(409).json({
    success: false,
    message: 'Online payment initiation is not implemented yet. Use manual payment confirmation flow.',
  });
});

router.post('/verify', authorize('CUSTOMER'), (req, res) => {
  res.status(409).json({
    success: false,
    message: 'Online payment verification is not implemented yet. Use manual payment confirmation flow.',
  });
});

router.patch(
  '/provider/bookings/:bookingId/submit-final-amount',
  authorize('PROVIDER'),
  requireApprovedProvider,
  controller.submitProviderFinalAmount
);

router.patch('/customer/bookings/:bookingId/confirm-payment', authorize('CUSTOMER'), controller.confirmCustomerPayment);
router.patch('/customer/bookings/:bookingId/dispute-payment', authorize('CUSTOMER'), controller.disputeCustomerPayment);

module.exports = router;
