const express = require('express');

const bookingController = require('../bookings/booking.controller');
const paymentController = require('../payments/payment.controller');
const customerController = require('./customer.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('CUSTOMER'));

// Customer saved addresses
router.get('/addresses', customerController.listCustomerAddresses);
router.post('/addresses', customerController.createCustomerAddress);
router.patch('/addresses/:id/default', customerController.setDefaultAddress);
router.patch('/addresses/:id', customerController.updateCustomerAddress);
router.delete('/addresses/:id', customerController.deleteCustomerAddress);

// Customer bookings
router.get('/bookings', bookingController.listBookings);
router.get('/bookings/:id', bookingController.getBooking);
router.get('/stats', bookingController.getCustomerStats);

// Customer payments
router.get('/payments', paymentController.listCustomerPayments);
router.get('/bookings/:bookingId/payment', paymentController.getCustomerBookingPayment);
router.patch('/bookings/:bookingId/confirm-payment', paymentController.confirmCustomerPayment);
router.patch('/bookings/:bookingId/dispute-payment', paymentController.disputeCustomerPayment);

module.exports = router;