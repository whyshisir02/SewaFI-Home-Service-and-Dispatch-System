const express = require('express');
const router = express.Router();
const ctrl = require('./booking.controller');
const paymentController = require('../payments/payment.controller');
const {
  authenticate,
  authorize,
  requireApprovedProvider,
} = require('../../middlewares/auth.middleware');
const { bookingCreateLimiter } = require('../../middlewares/rate-limit.middleware');

router.use(authenticate);

router.get('/stats/provider', authorize('PROVIDER'), requireApprovedProvider, ctrl.getProviderStats);
router.get('/stats/customer', authorize('CUSTOMER'), ctrl.getCustomerStats);
router.get('/provider/available', authorize('PROVIDER'), requireApprovedProvider, ctrl.getAvailableProviderBookings);
router.post('/', bookingCreateLimiter, authorize('CUSTOMER'), ctrl.createBooking);
router.get('/', ctrl.listBookings);
router.get('/:id', ctrl.getBooking);
router.get('/:id/timeline', ctrl.getBookingTimelineById);
router.patch('/:id/accept', authorize('PROVIDER'), requireApprovedProvider, ctrl.acceptBooking);
router.patch('/:id/reject', authorize('PROVIDER'), requireApprovedProvider, ctrl.rejectBooking);
router.patch('/:id/start', authorize('PROVIDER'), requireApprovedProvider, ctrl.startBooking);
router.patch('/:id/complete', authorize('PROVIDER'), requireApprovedProvider, ctrl.completeBooking);
router.patch('/:id/status', authorize('PROVIDER'), requireApprovedProvider, ctrl.updateStatus);
router.patch('/:id/submit-final-amount', authorize('PROVIDER'), requireApprovedProvider, (req, res, next) => {
  req.params.bookingId = req.params.id;
  return paymentController.submitProviderFinalAmount(req, res, next);
});
router.patch('/:id/confirm-payment', authorize('CUSTOMER'), (req, res, next) => {
  req.params.bookingId = req.params.id;
  return paymentController.confirmCustomerPayment(req, res, next);
});
router.patch('/:id/dispute-payment', authorize('CUSTOMER'), (req, res, next) => {
  req.params.bookingId = req.params.id;
  return paymentController.disputeCustomerPayment(req, res, next);
});
router.patch('/:id/cancel', authorize('CUSTOMER'), ctrl.cancelBooking);

module.exports = router;
