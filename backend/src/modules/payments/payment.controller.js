const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const paymentService = require('./payment.service');

const submitProviderFinalAmount = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { finalAmount, providerNote } = req.body;

  const result = await paymentService.submitFinalAmount({
    bookingId,
    providerUserId: req.user.id,
    providerRole: req.user.role,
    finalAmount,
    providerNote,
  });

  res.json(new ApiResponse(200, result, 'Final amount submitted for customer confirmation'));
});

const getCustomerBookingPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.getCustomerBookingPayment({
    bookingId: req.params.bookingId,
    customerId: req.user.id,
  });
  res.json(new ApiResponse(200, result, 'Customer booking payment fetched'));
});

const confirmCustomerPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.confirmPayment({
    bookingId: req.params.bookingId,
    customerUserId: req.user.id,
    customerRole: req.user.role,
    paymentMethod: req.body.paymentMethod,
    customerNote: req.body.customerNote,
  });
  res.json(new ApiResponse(200, result, 'Payment confirmed'));
});

const disputeCustomerPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.disputePayment({
    bookingId: req.params.bookingId,
    customerUserId: req.user.id,
    customerRole: req.user.role,
    reason: req.body.reason,
  });
  res.json(new ApiResponse(200, result, 'Payment dispute submitted'));
});

const listCustomerPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listCustomerPayments({
    customerId: req.user.id,
    query: req.query,
  });
  res.json(new ApiResponse(200, result.payments, 'Customer payments fetched', result.meta));
});

const listAdminPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listAdminPayments(req.query);
  res.json(new ApiResponse(200, result.payments, 'Admin payments fetched', result.meta));
});

const getAdminPaymentStats = asyncHandler(async (req, res) => {
  const stats = await paymentService.getAdminPaymentStats();
  res.json(new ApiResponse(200, stats, 'Admin payment stats fetched'));
});

const getAdminPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getAdminPaymentById(req.params.id);
  res.json(new ApiResponse(200, payment, 'Admin payment fetched'));
});

const resolveAdminPaymentDispute = asyncHandler(async (req, res) => {
  const result = await paymentService.resolveDispute({
    paymentId: req.params.paymentId,
    adminUserId: req.user.id,
    adminRole: req.user.role,
    finalAmount: req.body.finalAmount,
    adminNote: req.body.adminNote,
    markPaid: req.body.markPaid !== false,
  });
  res.json(new ApiResponse(200, result, 'Payment dispute resolved'));
});

const settleAdminProviderPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.settleProvider({
    paymentId: req.params.paymentId,
    adminUserId: req.user.id,
    adminRole: req.user.role,
    adminNote: req.body.adminNote,
  });
  res.json(new ApiResponse(200, result, 'Provider settlement marked as settled'));
});

const updateAdminPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.updatePaymentManual({
    paymentId: req.params.paymentId,
    payload: req.body,
  });
  res.json(new ApiResponse(200, result, 'Payment updated'));
});

const getProviderEarnings = asyncHandler(async (req, res) => {
  const result = await paymentService.getProviderEarnings({
    providerId: req.user.id,
    query: req.query,
  });

  // Keep compatibility for older provider dashboard widgets.
  res.json(new ApiResponse(200, {
    profile: result.profile,
    summary: result.summary,
    earnings: result.earningsSummary,
    transactions: result.earnings,
    payoutStatus: {
      pending: result.summary.pendingEarnings,
      settled: result.summary.settledEarnings,
    },
    meta: result.meta,
  }, 'Provider earnings fetched'));
});

module.exports = {
  submitProviderFinalAmount,
  getCustomerBookingPayment,
  confirmCustomerPayment,
  disputeCustomerPayment,
  listCustomerPayments,
  listAdminPayments,
  getAdminPaymentStats,
  getAdminPaymentById,
  resolveAdminPaymentDispute,
  settleAdminProviderPayment,
  updateAdminPayment,
  getProviderEarnings,
};
