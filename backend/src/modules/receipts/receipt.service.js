const crypto = require('crypto');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildReceiptPdf } = require('./receipt.pdf');

const toMoney = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
};

const buildReceiptFileName = (receipt) => `${receipt.receiptNumber}.pdf`;

const loadPaymentWithDetails = async (paymentId) =>
  prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          provider: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

const getReceiptRowById = async (receiptId) => {
  const rows = await prisma.$queryRaw`
    SELECT * FROM "receipts"
    WHERE "id" = ${receiptId}
    LIMIT 1
  `;
  return rows?.[0] || null;
};

const getReceiptRowByPaymentId = async (paymentId) => {
  const rows = await prisma.$queryRaw`
    SELECT * FROM "receipts"
    WHERE "paymentId" = ${paymentId}
    LIMIT 1
  `;
  return rows?.[0] || null;
};

const buildReceiptNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS "count"
    FROM "receipts"
    WHERE "createdAt" >= ${startOfYear} AND "createdAt" < ${endOfYear}
  `;
  const count = Number(rows?.[0]?.count || 0);
  return `SEWAFI-RCP-${year}-${String(count + 1).padStart(6, '0')}`;
};

const mapReceipt = (receiptRow, payment) => ({
  id: receiptRow.id,
  receiptNumber: receiptRow.receiptNumber,
  paymentId: receiptRow.paymentId,
  bookingId: receiptRow.bookingId,
  customerId: receiptRow.customerId,
  providerId: receiptRow.providerId,
  currency: receiptRow.currency || 'NPR',
  grossAmount: toMoney(receiptRow.grossAmount),
  finalAmount: toMoney(receiptRow.finalAmount),
  platformFeeAmount: toMoney(receiptRow.platformFeeAmount),
  providerEarningAmount: toMoney(receiptRow.providerEarningAmount),
  paymentMethod: receiptRow.paymentMethod || payment?.paymentMethod || 'CASH',
  paymentStatus: payment?.paymentStatus || 'PAID',
  payoutStatus: payment?.payoutStatus || 'PENDING',
  paymentCompletedAt: receiptRow.paymentCompletedAt || payment?.paidAt || payment?.confirmedAt || null,
  createdAt: receiptRow.createdAt,
  updatedAt: receiptRow.updatedAt,
  bookingCode: payment?.booking?.bookingCode || null,
  bookingStatus: payment?.booking?.status || null,
  serviceName: payment?.booking?.service?.name || null,
  customer: payment?.booking?.customer
    ? {
        id: payment.booking.customer.id,
        name: payment.booking.customer.name,
        email: payment.booking.customer.email || null,
        phone: payment.booking.customer.phone || null,
      }
    : null,
  provider: payment?.booking?.provider
    ? {
        id: payment.booking.provider.id,
        name: payment.booking.provider.name,
        email: payment.booking.provider.email || null,
        phone: payment.booking.provider.phone || null,
      }
    : null,
});

const createOrUpdateReceiptRow = async (payment) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const receiptNumber =
      attempt === 0
        ? await buildReceiptNumber()
        : `SEWAFI-RCP-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;

    try {
      const rows = await prisma.$queryRaw`
        INSERT INTO "receipts" (
          "id",
          "receiptNumber",
          "paymentId",
          "bookingId",
          "customerId",
          "providerId",
          "currency",
          "grossAmount",
          "finalAmount",
          "platformFeeAmount",
          "providerEarningAmount",
          "paymentMethod",
          "paymentCompletedAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${crypto.randomUUID()},
          ${receiptNumber},
          ${payment.id},
          ${payment.bookingId},
          ${payment.customerId},
          ${payment.providerId || null},
          ${'NPR'},
          ${payment.grossAmount},
          ${payment.finalAmount},
          ${payment.platformFeeAmount},
          ${payment.providerEarningAmount},
          NULLIF(${payment.paymentMethod || ''}, '')::"PaymentMethod",
          ${payment.paidAt || payment.confirmedAt || new Date()},
          NOW(),
          NOW()
        )
        ON CONFLICT ("paymentId") DO UPDATE SET
          "bookingId" = EXCLUDED."bookingId",
          "customerId" = EXCLUDED."customerId",
          "providerId" = EXCLUDED."providerId",
          "currency" = EXCLUDED."currency",
          "grossAmount" = EXCLUDED."grossAmount",
          "finalAmount" = EXCLUDED."finalAmount",
          "platformFeeAmount" = EXCLUDED."platformFeeAmount",
          "providerEarningAmount" = EXCLUDED."providerEarningAmount",
          "paymentMethod" = EXCLUDED."paymentMethod",
          "paymentCompletedAt" = EXCLUDED."paymentCompletedAt",
          "updatedAt" = NOW()
        RETURNING *
      `;
      return rows?.[0] || null;
    } catch (error) {
      if (error?.code !== 'P2002' && !String(error?.message || '').includes('receipts_receiptNumber_key')) {
        throw error;
      }
    }
  }

  throw new ApiError(500, 'Unable to generate a unique receipt number right now.');
};

const ensureReceiptForPayment = async (paymentId) => {
  const payment = await loadPaymentWithDetails(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.paymentStatus !== 'PAID' || payment.booking?.status !== 'COMPLETED') {
    throw new ApiError(409, 'Receipt is available only for completed paid bookings.');
  }

  let receiptRow = await getReceiptRowByPaymentId(payment.id);
  if (!receiptRow) {
    receiptRow = await createOrUpdateReceiptRow(payment);
  }

  return mapReceipt(receiptRow, payment);
};

const getReceiptByIdForCustomer = async ({ receiptId, customerId }) => {
  const row = await getReceiptRowById(receiptId);
  if (!row || row.customerId !== customerId) {
    throw new ApiError(404, 'Receipt not found.');
  }
  const payment = await loadPaymentWithDetails(row.paymentId);
  return mapReceipt(row, payment);
};

const getReceiptByBookingForCustomer = async ({ bookingId, customerId }) => {
  const payment = await prisma.payment.findFirst({
    where: { bookingId, customerId },
  });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found for this booking.');
  }
  return ensureReceiptForPayment(payment.id);
};

const getReceiptByIdForAdmin = async (receiptId) => {
  const row = await getReceiptRowById(receiptId);
  if (!row) {
    throw new ApiError(404, 'Receipt not found.');
  }
  const payment = await loadPaymentWithDetails(row.paymentId);
  return mapReceipt(row, payment);
};

const getReceiptByPaymentForAdmin = async (paymentId) => ensureReceiptForPayment(paymentId);

const listCustomerReceipts = async ({ customerId, query = {} }) => {
  const { page, limit, skip, take } = getPagination(query);
  const search = String(query.search || '').trim();
  const sort = String(query.sort || 'newest').toLowerCase();

  const where = {
    customerId,
    paymentStatus: 'PAID',
    booking: {
      is: {
        status: 'COMPLETED',
        ...(search
          ? {
              OR: [
                { bookingCode: { contains: search, mode: 'insensitive' } },
                { service: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
    },
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  const receipts = await Promise.all(payments.map((payment) => ensureReceiptForPayment(payment.id)));
  return {
    receipts,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

const listAdminReceipts = async ({ query = {} }) => {
  const { page, limit, skip, take } = getPagination(query);
  const search = String(query.search || '').trim();
  const sort = String(query.sort || 'newest').toLowerCase();

  const where = {
    paymentStatus: 'PAID',
    booking: {
      is: {
        status: 'COMPLETED',
        ...(search
          ? {
              OR: [
                { bookingCode: { contains: search, mode: 'insensitive' } },
                { service: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { provider: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
    },
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  const receipts = await Promise.all(payments.map((payment) => ensureReceiptForPayment(payment.id)));
  return {
    receipts,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

const buildReceiptPdfBuffer = async (receipt, options = {}) => buildReceiptPdf(receipt, options);

module.exports = {
  buildReceiptFileName,
  buildReceiptPdfBuffer,
  ensureReceiptForPayment,
  getReceiptByIdForCustomer,
  getReceiptByBookingForCustomer,
  getReceiptByIdForAdmin,
  getReceiptByPaymentForAdmin,
  listCustomerReceipts,
  listAdminReceipts,
};
