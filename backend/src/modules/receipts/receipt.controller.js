const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const receiptService = require('./receipt.service');

const listCustomerReceipts = asyncHandler(async (req, res) => {
  const result = await receiptService.listCustomerReceipts({
    customerId: req.user.id,
    query: req.query,
  });

  res.json(new ApiResponse(200, result.receipts, 'Customer receipts fetched', result.meta));
});

const getCustomerReceiptById = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByIdForCustomer({
    receiptId: req.params.id,
    customerId: req.user.id,
  });

  res.json(new ApiResponse(200, receipt, 'Customer receipt fetched'));
});

const getCustomerReceiptByBooking = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByBookingForCustomer({
    bookingId: req.params.bookingId,
    customerId: req.user.id,
  });

  res.json(new ApiResponse(200, receipt, 'Customer booking receipt fetched'));
});

const downloadCustomerReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByIdForCustomer({
    receiptId: req.params.id,
    customerId: req.user.id,
  });
  const buffer = await receiptService.buildReceiptPdfBuffer(receipt, { audience: 'customer' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${receiptService.buildReceiptFileName(receipt)}"`);
  res.send(buffer);
});

const listAdminReceipts = asyncHandler(async (req, res) => {
  const result = await receiptService.listAdminReceipts({ query: req.query });
  res.json(new ApiResponse(200, result.receipts, 'Admin receipts fetched', result.meta));
});

const getAdminReceiptById = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByIdForAdmin(req.params.id);
  res.json(new ApiResponse(200, receipt, 'Admin receipt fetched'));
});

const getAdminReceiptByPayment = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByPaymentForAdmin(req.params.paymentId);
  res.json(new ApiResponse(200, receipt, 'Admin payment receipt fetched'));
});

const downloadAdminReceipt = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptByIdForAdmin(req.params.id);
  const buffer = await receiptService.buildReceiptPdfBuffer(receipt, { audience: 'admin' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${receiptService.buildReceiptFileName(receipt)}"`);
  res.send(buffer);
});

module.exports = {
  listCustomerReceipts,
  getCustomerReceiptById,
  getCustomerReceiptByBooking,
  downloadCustomerReceipt,
  listAdminReceipts,
  getAdminReceiptById,
  getAdminReceiptByPayment,
  downloadAdminReceipt,
};
