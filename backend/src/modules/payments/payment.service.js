const { prisma } = require('../../config/database');
const env = require('../../config/env');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');
const { createStatusHistory } = require('../bookings/booking-history.service');
const notificationService = require('../../services/notification.service');
const { emitToRole, emitToUser } = require('../../config/socket');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const receiptService = require('../receipts/receipt.service');

const DEFAULT_PAYMENT_METHOD = 'CASH';
const ALLOWED_MANUAL_PAYMENT_METHODS = ['CASH', 'MANUAL', 'BANK_TRANSFER'];
const MANUAL_UPDATABLE_PAYMENT_STATUSES = [
  'PENDING',
  'AWAITING_CONFIRMATION',
  'CONFIRMED',
  'PAID',
  'DISPUTED',
  'CANCELLED',
  'REFUNDED',
  'CANCELLATION_FEE',
];
const MANUAL_UPDATABLE_PAYOUT_STATUSES = ['PENDING', 'SETTLED', 'HOLD', 'CANCELLED'];
const FINAL_AMOUNT_SUBMITTED_MESSAGE = 'WORK_COMPLETED_AMOUNT_SUBMITTED';

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMoney = (value) => {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
};

const toPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 10;
  return Number(parsed.toFixed(2));
};

const getCommissionPercent = () => toPercent(env.PLATFORM_COMMISSION_PERCENT || process.env.PLATFORM_COMMISSION_PERCENT || 10);

const calculateCommission = (finalAmount, percent) => {
  const gross = toMoney(finalAmount) || 0;
  const feePercent = toPercent(percent);
  const fee = toMoney((gross * feePercent) / 100) || 0;
  const providerEarning = toMoney(gross - fee) || 0;
  return {
    grossAmount: gross,
    platformFeePercent: feePercent,
    platformFeeAmount: fee,
    providerEarningAmount: providerEarning,
  };
};

const runInBackground = (task) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      logger.error(`[payment.service] Background task failed: ${error?.message || error}`);
    });
};

const mapPaymentForList = (payment) => ({
  id: payment.id,
  bookingId: payment.bookingId,
  bookingCode: payment.booking?.bookingCode || null,
  bookingStatus: payment.booking?.status || null,
  serviceName: payment.booking?.service?.name || null,
  customer: payment.booking?.customer
    ? {
        id: payment.booking.customer.id,
        name: payment.booking.customer.name,
        fullName: payment.booking.customer.name,
        email: payment.booking.customer.email || null,
      }
    : null,
  provider: payment.booking?.provider
    ? {
        id: payment.booking.provider.id,
        name: payment.booking.provider.name,
        fullName: payment.booking.provider.name,
        email: payment.booking.provider.email || null,
      }
    : null,
  grossAmount: toMoney(payment.grossAmount),
  estimatedAmount: toMoney(payment.estimatedAmount),
  providerProposedAmount: toMoney(payment.providerProposedAmount),
  finalAmount: toMoney(payment.finalAmount),
  platformFeePercent: toMoney(payment.platformFeePercent),
  platformFeeAmount: toMoney(payment.platformFeeAmount),
  providerEarningAmount: toMoney(payment.providerEarningAmount),
  paymentMethod: payment.paymentMethod,
  paymentStatus: payment.paymentStatus,
  payoutStatus: payment.payoutStatus,
  providerNote: payment.providerNote || null,
  customerNote: payment.customerNote || null,
  disputeReason: payment.disputeReason || null,
  adminNote: payment.adminNote || null,
  proposedAt: payment.proposedAt,
  confirmedAt: payment.confirmedAt,
  paidAt: payment.paidAt,
  disputedAt: payment.disputedAt,
  settledAt: payment.settledAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  receipt: payment.receipt
    ? {
        id: payment.receipt.id,
        receiptNumber: payment.receipt.receiptNumber,
        createdAt: payment.receipt.createdAt,
      }
    : null,
});

const getBookingWithPayment = async (bookingId) =>
  prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      customer: { select: { id: true, name: true, email: true, phone: true } },
      provider: { select: { id: true, name: true, email: true, phone: true } },
      payment: true,
      review: true,
    },
  });

const ensureProviderBookingAccess = (booking, providerId) => {
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.providerId !== providerId) {
    throw new ApiError(403, 'You are not assigned to this booking');
  }
  if (booking.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'Final amount can be submitted only for in-progress bookings');
  }
};

const ensureCustomerBookingAccess = (booking, customerId) => {
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== customerId) {
    throw new ApiError(404, 'Booking not found');
  }
};

const submitFinalAmount = async ({ bookingId, providerUserId, providerRole, finalAmount, providerNote }) => {
  const normalizedFinalAmount = toMoney(finalAmount);
  if (!normalizedFinalAmount || normalizedFinalAmount <= 0) {
    throw new ApiError(400, 'finalAmount must be greater than 0');
  }

  const booking = await getBookingWithPayment(bookingId);
  ensureProviderBookingAccess(booking, providerUserId);

  const commissionPercent = getCommissionPercent();
  const now = new Date();
  const nextStatus = booking.status === 'ACCEPTED' ? 'IN_PROGRESS' : booking.status;

  await prisma.$transaction([
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        customerId: booking.customerId,
        providerId: booking.providerId,
        grossAmount: normalizedFinalAmount,
        estimatedAmount: toMoney(booking.estimatedAmount || booking.basePrice),
        providerProposedAmount: normalizedFinalAmount,
        platformFeePercent: commissionPercent,
        paymentMethod: DEFAULT_PAYMENT_METHOD,
        paymentStatus: 'AWAITING_CONFIRMATION',
        payoutStatus: 'PENDING',
        providerNote: providerNote || null,
        proposedAt: now,
      },
      update: {
        providerId: booking.providerId,
        grossAmount: normalizedFinalAmount,
        estimatedAmount: toMoney(booking.estimatedAmount || booking.basePrice),
        providerProposedAmount: normalizedFinalAmount,
        platformFeePercent: commissionPercent,
        paymentStatus: 'AWAITING_CONFIRMATION',
        payoutStatus: 'PENDING',
        providerNote: providerNote || null,
        proposedAt: now,
        disputeReason: null,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus,
        estimatedAmount: booking.estimatedAmount || booking.basePrice,
        providerProposedAmount: normalizedFinalAmount,
        providerCompletionNote: providerNote || null,
        paymentStatus: 'AWAITING_CONFIRMATION',
      },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        status: nextStatus,
        actorUserId: providerUserId,
        actorRole: providerRole,
        message: FINAL_AMOUNT_SUBMITTED_MESSAGE,
      },
    }),
  ]);

  const latest = await getBookingWithPayment(bookingId);
  if (!latest) {
    throw new ApiError(404, 'Booking not found');
  }

  runInBackground(() =>
    notificationService.notifyStatusUpdate(
      latest.customerId,
      'AWAITING_CONFIRMATION',
      latest.bookingCode,
      latest.id,
      'CUSTOMER'
    )
  );

  emitToUser(latest.customerId, 'payment:awaiting-confirmation', {
    bookingId: latest.id,
    bookingCode: latest.bookingCode,
    providerProposedAmount: normalizedFinalAmount,
  });
  emitToUser(latest.customerId, 'booking:update', latest);
  emitToUser(providerUserId, 'booking:update', latest);

  return mapPaymentForList({
    ...latest.payment,
    booking: latest,
  });
};

const getCustomerBookingPayment = async ({ bookingId, customerId }) => {
  const booking = await getBookingWithPayment(bookingId);
  ensureCustomerBookingAccess(booking, customerId);

  if (!booking.payment) {
    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      service: booking.service ? { id: booking.service.id, name: booking.service.name } : null,
      provider: booking.provider ? { id: booking.provider.id, name: booking.provider.name } : null,
      estimatedAmount: toMoney(booking.estimatedAmount || booking.basePrice),
      providerProposedAmount: toMoney(booking.providerProposedAmount),
      finalAmount: toMoney(booking.finalAmount),
      paymentStatus: booking.paymentStatus || 'PENDING',
      paymentMethod: booking.paymentMethod || null,
      providerNote: booking.providerCompletionNote || null,
      customerNote: null,
      paidAt: booking.paidAt || null,
      review: booking.review || null,
    };
  }

  return {
    id: booking.payment.id,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    service: booking.service ? { id: booking.service.id, name: booking.service.name } : null,
    provider: booking.provider ? { id: booking.provider.id, name: booking.provider.name } : null,
    estimatedAmount: toMoney(booking.payment.estimatedAmount || booking.estimatedAmount || booking.basePrice),
    providerProposedAmount: toMoney(booking.payment.providerProposedAmount || booking.providerProposedAmount),
    finalAmount: toMoney(booking.payment.finalAmount || booking.finalAmount),
    paymentStatus: booking.payment.paymentStatus,
    paymentMethod: booking.payment.paymentMethod,
    providerNote: booking.payment.providerNote || booking.providerCompletionNote || null,
    customerNote: booking.payment.customerNote || null,
    paidAt: booking.payment.paidAt || booking.paidAt || null,
    createdAt: booking.payment.createdAt,
    updatedAt: booking.payment.updatedAt,
    receipt: booking.payment.receipt
      ? {
          id: booking.payment.receipt.id,
          receiptNumber: booking.payment.receipt.receiptNumber,
          createdAt: booking.payment.receipt.createdAt,
        }
      : null,
    booking,
    review: booking.review || null,
  };
};

const confirmPayment = async ({ bookingId, customerUserId, customerRole, paymentMethod, customerNote }) => {
  const booking = await getBookingWithPayment(bookingId);
  ensureCustomerBookingAccess(booking, customerUserId);

  if (!booking.payment) {
    throw new ApiError(409, 'Provider has not submitted the final amount yet');
  }

  if (booking.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'Booking is not ready for payment confirmation');
  }

  if (booking.payment.paymentStatus !== 'AWAITING_CONFIRMATION') {
    throw new ApiError(409, 'Payment is not awaiting customer confirmation');
  }

  const finalAmount = toMoney(booking.payment.providerProposedAmount || booking.providerProposedAmount);
  if (!finalAmount || finalAmount <= 0) {
    throw new ApiError(409, 'Final amount is not available for confirmation');
  }

  const method = (paymentMethod || booking.payment.paymentMethod || DEFAULT_PAYMENT_METHOD).toUpperCase();
  if (!ALLOWED_MANUAL_PAYMENT_METHODS.includes(method)) {
    throw new ApiError(400, `Unsupported manual payment method: ${method}`);
  }

  const commission = calculateCommission(finalAmount, booking.payment.platformFeePercent || getCommissionPercent());

  const updated = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { bookingId },
      data: {
        finalAmount,
        grossAmount: commission.grossAmount,
        platformFeePercent: commission.platformFeePercent,
        platformFeeAmount: commission.platformFeeAmount,
        providerEarningAmount: commission.providerEarningAmount,
        paymentMethod: method,
        paymentStatus: 'PAID',
        payoutStatus: 'PENDING',
        customerNote: customerNote || null,
        confirmedAt: new Date(),
        paidAt: new Date(),
      },
    });

    const bookingUpdated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        finalAmount,
        totalPrice: finalAmount,
        paymentMethod: method,
        paymentStatus: 'PAID',
        paidAt: new Date(),
        customerConfirmedAt: new Date(),
        status: 'COMPLETED',
        completedAt: booking.completedAt || new Date(),
      },
      include: {
        service: true,
        customer: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    await createStatusHistory({
      bookingId,
      status: 'COMPLETED',
      actorUserId: customerUserId,
      actorRole: customerRole,
      message: 'CUSTOMER_CONFIRMED_PAYMENT',
      tx,
    });

    if (booking.providerId) {
      await tx.providerProfile.updateMany({
        where: { userId: booking.providerId },
        data: { isCurrentlyBusy: false },
      });
    }

    return { payment, booking: bookingUpdated };
  });

  if (booking.providerId) {
    runInBackground(() =>
      notificationService.notifyStatusUpdate(
        booking.providerId,
        'COMPLETED',
        booking.bookingCode,
        booking.id,
        'PROVIDER'
      )
    );
    emitToUser(booking.providerId, 'payment:confirmed', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      providerEarningAmount: commission.providerEarningAmount,
    });
  }

  runInBackground(() =>
    notificationService.notifyReviewRequest(
      customerUserId,
      booking.id,
      booking.bookingCode
    )
  );

  let createdReceipt = null;
  try {
    createdReceipt = await receiptService.ensureReceiptForPayment(updated.payment.id);
  } catch (error) {
    logger.error(`[payment.service] Receipt creation failed after payment confirmation: ${error?.message || error}`);
  }

  emitToRole('ADMIN', 'payment:confirmed', {
    bookingId: booking.id,
    paymentId: updated.payment.id,
    bookingCode: booking.bookingCode,
  });
  emitToUser(customerUserId, 'booking:update', updated.booking);
  if (booking.providerId) {
    emitToUser(booking.providerId, 'booking:update', updated.booking);
  }

  return mapPaymentForList({
    ...updated.payment,
    booking: updated.booking,
    receipt: createdReceipt,
  });
};

const disputePayment = async ({ bookingId, customerUserId, customerRole, reason }) => {
  const booking = await getBookingWithPayment(bookingId);
  ensureCustomerBookingAccess(booking, customerUserId);

  if (!booking.payment) {
    throw new ApiError(409, 'Provider has not submitted the final amount yet');
  }
  if (booking.payment.paymentStatus !== 'AWAITING_CONFIRMATION') {
    throw new ApiError(409, 'Payment is not awaiting customer confirmation');
  }
  if (!String(reason || '').trim()) {
    throw new ApiError(400, 'Dispute reason is required');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { bookingId },
      data: {
        paymentStatus: 'DISPUTED',
        payoutStatus: 'HOLD',
        disputeReason: String(reason).trim(),
        customerNote: String(reason).trim(),
        disputedAt: new Date(),
      },
    });

    const bookingUpdated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'DISPUTED',
      },
      include: {
        service: true,
        customer: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    await createStatusHistory({
      bookingId,
      status: bookingUpdated.status,
      actorUserId: customerUserId,
      actorRole: customerRole,
      message: 'PAYMENT_DISPUTED',
      tx,
    });

    return { payment, booking: bookingUpdated };
  });

  emitToRole('ADMIN', 'payment:disputed', {
    bookingId: booking.id,
    paymentId: updated.payment.id,
    bookingCode: booking.bookingCode,
  });
  if (booking.providerId) {
    runInBackground(() =>
      notificationService.notifyPaymentDisputed(
        booking.providerId,
        booking.bookingCode,
        booking.id
      )
    );

    emitToUser(booking.providerId, 'payment:disputed', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      reason: String(reason).trim(),
    });
  }

  runInBackground(() =>
    notificationService.notifyAdminPaymentDisputed(
      booking.bookingCode,
      booking.id
    )
  );

  emitToUser(customerUserId, 'booking:update', updated.booking);

  return mapPaymentForList({
    ...updated.payment,
    booking: updated.booking,
  });
};

const buildAdminPaymentWhere = (query = {}) => {
  const where = {};
  const search = String(query.search || '').trim();
  const paymentStatus = String(query.paymentStatus || '').trim();
  const payoutStatus = String(query.payoutStatus || '').trim();
  const paymentMethod = String(query.paymentMethod || '').trim();
  const dateFrom = String(query.dateFrom || '').trim();
  const dateTo = String(query.dateTo || '').trim();

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (payoutStatus) where.payoutStatus = payoutStatus;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  if (search) {
    where.OR = [
      { booking: { bookingCode: { contains: search, mode: 'insensitive' } } },
      { booking: { service: { name: { contains: search, mode: 'insensitive' } } } },
      { booking: { customer: { name: { contains: search, mode: 'insensitive' } } } },
      { booking: { provider: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  return where;
};

const listAdminPayments = async (query = {}) => {
  const { page, limit, skip, take } = getPagination(query);
  const sort = String(query.sort || 'newest').toLowerCase();
  const where = buildAdminPaymentWhere(query);
  let orderBy = { createdAt: 'desc' };
  if (sort === 'oldest') orderBy = { createdAt: 'asc' };
  if (sort === 'amount_asc') orderBy = { finalAmount: 'asc' };
  if (sort === 'amount_desc') orderBy = { finalAmount: 'desc' };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map(mapPaymentForList),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

const getAdminPaymentStats = async () => {
  const paidCompletedWhere = {
    paymentStatus: 'PAID',
    booking: {
      is: {
        status: 'COMPLETED',
      },
    },
  };

  const [paidAgg, pendingSettlementsAgg, pendingSettlements, settledAgg, paidBookingsCount, disputedPaymentsCount, disputedAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: paidCompletedWhere,
      _sum: {
        finalAmount: true,
        platformFeeAmount: true,
        providerEarningAmount: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        payoutStatus: 'PENDING',
      },
      _sum: {
        providerEarningAmount: true,
      },
    }),
    prisma.payment.count({
      where: {
        ...paidCompletedWhere,
        payoutStatus: 'PENDING',
      },
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        payoutStatus: 'SETTLED',
      },
      _sum: { providerEarningAmount: true },
    }),
    prisma.payment.count({ where: paidCompletedWhere }),
    prisma.payment.count({ where: { paymentStatus: 'DISPUTED' } }),
    prisma.payment.aggregate({
      where: { paymentStatus: 'DISPUTED' },
      _sum: { finalAmount: true },
    }),
  ]);

  return {
    totalGrossAmount: toMoney(paidAgg._sum.finalAmount || 0) || 0,
    totalPlatformCommission: toMoney(paidAgg._sum.platformFeeAmount || 0) || 0,
    totalProviderEarnings: toMoney(paidAgg._sum.providerEarningAmount || 0) || 0,
    pendingSettlements,
    pendingSettlementAmount: toMoney(pendingSettlementsAgg._sum.providerEarningAmount || 0) || 0,
    settledProviderEarnings: toMoney(settledAgg._sum.providerEarningAmount || 0) || 0,
    paidBookingsCount,
    disputedPaymentsCount,
    disputedAmount: toMoney(disputedAgg._sum.finalAmount || 0) || 0,
  };
};

const getAdminPaymentById = async (paymentId) => {
  const payment = await prisma.payment.findUnique({
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

  if (!payment) throw new ApiError(404, 'Payment not found');
  return mapPaymentForList(payment);
};

const resolveDispute = async ({ paymentId, adminUserId, adminRole, finalAmount, adminNote, markPaid }) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.paymentStatus !== 'DISPUTED' && payment.paymentStatus !== 'AWAITING_CONFIRMATION') {
    throw new ApiError(409, 'Payment is not in a resolvable dispute state');
  }

  const normalizedFinalAmount = toMoney(finalAmount);
  if (!normalizedFinalAmount || normalizedFinalAmount <= 0) {
    throw new ApiError(400, 'finalAmount must be greater than 0');
  }

  const commission = calculateCommission(normalizedFinalAmount, payment.platformFeePercent || getCommissionPercent());
  const nextStatus = markPaid ? 'PAID' : 'CONFIRMED';

  const updated = await prisma.$transaction(async (tx) => {
    const nextPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        finalAmount: normalizedFinalAmount,
        grossAmount: commission.grossAmount,
        platformFeePercent: commission.platformFeePercent,
        platformFeeAmount: commission.platformFeeAmount,
        providerEarningAmount: commission.providerEarningAmount,
        paymentStatus: nextStatus,
        payoutStatus: 'PENDING',
        adminNote: adminNote || null,
        confirmedAt: new Date(),
        ...(markPaid ? { paidAt: new Date() } : {}),
      },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const bookingStatus = markPaid ? 'COMPLETED' : payment.booking.status;
    const bookingUpdated = await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        finalAmount: normalizedFinalAmount,
        totalPrice: normalizedFinalAmount,
        paymentStatus: nextStatus,
        ...(markPaid ? { status: 'COMPLETED', paidAt: new Date(), customerConfirmedAt: new Date(), completedAt: new Date() } : {}),
      },
    });

    if (markPaid && payment.providerId) {
      await tx.providerProfile.updateMany({
        where: { userId: payment.providerId },
        data: { isCurrentlyBusy: false },
      });
    }

    await createStatusHistory({
      bookingId: payment.bookingId,
      status: bookingStatus,
      actorUserId: adminUserId,
      actorRole: adminRole,
      message: 'PAYMENT_DISPUTE_RESOLVED',
      tx,
    });

    return { payment: nextPayment, booking: bookingUpdated };
  });

  if (payment.customerId) {
    emitToUser(payment.customerId, 'payment:resolved', {
      paymentId,
      bookingId: payment.bookingId,
      paymentStatus: nextStatus,
    });
  }
  if (payment.providerId) {
    emitToUser(payment.providerId, 'payment:resolved', {
      paymentId,
      bookingId: payment.bookingId,
      paymentStatus: nextStatus,
    });
  }

  let createdReceipt = null;
  if (markPaid) {
    try {
      createdReceipt = await receiptService.ensureReceiptForPayment(updated.payment.id);
    } catch (error) {
      logger.error(`[payment.service] Receipt creation failed after dispute resolution: ${error?.message || error}`);
    }
  }

  return mapPaymentForList({
    ...updated.payment,
    receipt: createdReceipt || updated.payment.receipt,
  });
};

const settleProvider = async ({ paymentId, adminUserId, adminRole, adminNote }) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.payoutStatus === 'SETTLED') {
    const settledPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return mapPaymentForList(settledPayment);
  }
  if (payment.paymentStatus !== 'PAID') {
    throw new ApiError(409, 'Payment must be PAID before settlement');
  }
  if (payment.booking?.status !== 'COMPLETED') {
    throw new ApiError(409, 'Only completed bookings can be settled');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        payoutStatus: 'SETTLED',
        settledAt: new Date(),
        adminNote: adminNote || payment.adminNote || null,
      },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    await createStatusHistory({
      bookingId: payment.bookingId,
      status: payment.booking.status,
      actorUserId: adminUserId,
      actorRole: adminRole,
      message: 'PROVIDER_SETTLED',
      tx,
    });

    return nextPayment;
  });

  if (payment.providerId) {
    emitToUser(payment.providerId, 'payment:settled', {
      paymentId,
      bookingId: payment.bookingId,
      providerEarningAmount: toMoney(payment.providerEarningAmount) || 0,
    });
  }

  return mapPaymentForList(updated);
};

const updatePaymentManual = async ({ paymentId, payload = {} }) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: true,
    },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');

  const data = {};
  const bookingData = {};
  const nextFinalAmount = payload.finalAmount !== undefined ? toMoney(payload.finalAmount) : null;

  if (payload.finalAmount !== undefined) {
    if (!nextFinalAmount || nextFinalAmount <= 0) {
      throw new ApiError(400, 'finalAmount must be greater than 0');
    }
    const commission = calculateCommission(nextFinalAmount, payment.platformFeePercent || getCommissionPercent());
    data.finalAmount = nextFinalAmount;
    data.grossAmount = commission.grossAmount;
    data.platformFeePercent = commission.platformFeePercent;
    data.platformFeeAmount = commission.platformFeeAmount;
    data.providerEarningAmount = commission.providerEarningAmount;
    bookingData.finalAmount = nextFinalAmount;
    bookingData.totalPrice = nextFinalAmount;
  }

  if (payload.paymentStatus !== undefined) {
    const normalized = String(payload.paymentStatus).trim().toUpperCase();
    if (!MANUAL_UPDATABLE_PAYMENT_STATUSES.includes(normalized)) {
      throw new ApiError(400, `Unsupported paymentStatus: ${normalized}`);
    }
    data.paymentStatus = normalized;
    bookingData.paymentStatus = normalized;
    if (normalized === 'PAID' && !payment.paidAt) {
      data.paidAt = new Date();
      bookingData.paidAt = new Date();
    }
  }

  if (payload.payoutStatus !== undefined) {
    const normalized = String(payload.payoutStatus).trim().toUpperCase();
    if (!MANUAL_UPDATABLE_PAYOUT_STATUSES.includes(normalized)) {
      throw new ApiError(400, `Unsupported payoutStatus: ${normalized}`);
    }
    data.payoutStatus = normalized;
    if (normalized === 'SETTLED') {
      data.settledAt = new Date();
    }
  }

  if (payload.adminNote !== undefined) data.adminNote = String(payload.adminNote || '').trim() || null;

  const updated = await prisma.$transaction(async (tx) => {
    const nextPayment = await tx.payment.update({
      where: { id: paymentId },
      data,
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (Object.keys(bookingData).length) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: bookingData,
      });
    }

    return nextPayment;
  });

  let createdReceipt = null;
  if (data.paymentStatus === 'PAID') {
    try {
      createdReceipt = await receiptService.ensureReceiptForPayment(updated.id);
    } catch (error) {
      logger.error(`[payment.service] Receipt creation failed after manual payment update: ${error?.message || error}`);
    }
  }

  return mapPaymentForList({
    ...updated,
    receipt: createdReceipt || updated.receipt,
  });
};

const listCustomerPayments = async ({ customerId, query = {} }) => {
  const { page, limit, skip, take } = getPagination(query);
  const search = String(query.search || '').trim();
  const status = String(query.paymentStatus || '').trim();
  const sort = String(query.sort || 'newest').toLowerCase();

  const where = {
    customerId,
    ...(status ? { paymentStatus: status } : {}),
    ...(search
      ? {
          OR: [
            { booking: { bookingCode: { contains: search, mode: 'insensitive' } } },
            { booking: { service: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map(mapPaymentForList),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

const getProviderEarnings = async ({ providerId, query = {} }) => {
  const { page, limit, skip, take } = getPagination(query);
  const search = String(query.search || '').trim();
  const requestedPaymentStatus = String(query.paymentStatus || '').trim().toUpperCase();
  const payoutStatus = String(query.payoutStatus || '').trim();
  const sort = String(query.sort || 'newest').toLowerCase();

  if (requestedPaymentStatus && requestedPaymentStatus !== 'PAID') {
    return {
      profile: await prisma.providerProfile.findUnique({
        where: { userId: providerId },
        include: { category: true },
      }),
      summary: {
        totalGrossAmount: 0,
        totalPlatformFeeDeducted: 0,
        totalNetEarnings: 0,
        pendingEarnings: 0,
        settledEarnings: 0,
        completedPaidJobs: 0,
      },
      earnings: [],
      meta: buildPaginationMeta({ page, limit, total: 0 }),
      earningsSummary: {
        today: { amount: 0, count: 0 },
        last7days: { amount: 0, count: 0 },
        thisMonth: { amount: 0, count: 0 },
        total: { amount: 0, count: 0 },
      },
    };
  }

  const where = {
    providerId,
    paymentStatus: 'PAID',
    booking: {
      is: {
        status: 'COMPLETED',
      },
    },
    ...(payoutStatus ? { payoutStatus } : {}),
    ...(search
      ? {
          OR: [
            { booking: { bookingCode: { contains: search, mode: 'insensitive' } } },
            { booking: { service: { name: { contains: search, mode: 'insensitive' } } } },
            { booking: { customer: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const [payments, total, totals, pendingTotals, settledTotals, completedPaidJobs, profile] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: {
        grossAmount: true,
        platformFeeAmount: true,
        providerEarningAmount: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        payoutStatus: 'PENDING',
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: { providerEarningAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        payoutStatus: 'SETTLED',
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: { providerEarningAmount: true },
    }),
    prisma.payment.count({
      where: {
        providerId,
        paymentStatus: 'PAID',
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
    }),
    prisma.providerProfile.findUnique({
      where: { userId: providerId },
      include: { category: true },
    }),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [todayAgg, last7Agg, monthAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        paidAt: { gte: startOfDay },
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        paidAt: { gte: sevenDaysAgo },
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        providerId,
        paymentStatus: 'PAID',
        paidAt: { gte: startOfMonth },
        booking: {
          is: {
            status: 'COMPLETED',
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
  ]);

  return {
    profile,
    summary: {
      totalGrossAmount: toMoney(totals._sum.grossAmount || 0) || 0,
      totalPlatformFeeDeducted: toMoney(totals._sum.platformFeeAmount || 0) || 0,
      totalNetEarnings: toMoney(totals._sum.providerEarningAmount || 0) || 0,
      pendingEarnings: toMoney(pendingTotals._sum.providerEarningAmount || 0) || 0,
      settledEarnings: toMoney(settledTotals._sum.providerEarningAmount || 0) || 0,
      completedPaidJobs,
    },
    earnings: payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      bookingCode: payment.booking?.bookingCode || null,
      service: payment.booking?.service ? { id: payment.booking.service.id, name: payment.booking.service.name } : null,
      customer: payment.booking?.customer ? { id: payment.booking.customer.id, name: payment.booking.customer.name } : null,
      grossAmount: toMoney(payment.grossAmount),
      platformFeeAmount: toMoney(payment.platformFeeAmount),
      providerEarningAmount: toMoney(payment.providerEarningAmount),
      paymentStatus: payment.paymentStatus,
      payoutStatus: payment.payoutStatus,
      paidAt: payment.paidAt,
      settledAt: payment.settledAt,
      createdAt: payment.createdAt,
    })),
    meta: buildPaginationMeta({ page, limit, total }),
    earningsSummary: {
      today: { amount: toMoney(todayAgg._sum.providerEarningAmount || 0) || 0, count: todayAgg._count || 0 },
      last7days: { amount: toMoney(last7Agg._sum.providerEarningAmount || 0) || 0, count: last7Agg._count || 0 },
      thisMonth: { amount: toMoney(monthAgg._sum.providerEarningAmount || 0) || 0, count: monthAgg._count || 0 },
      total: { amount: toMoney(totals._sum.providerEarningAmount || 0) || 0, count: completedPaidJobs },
    },
  };
};

module.exports = {
  submitFinalAmount,
  getCustomerBookingPayment,
  confirmPayment,
  disputePayment,
  listAdminPayments,
  getAdminPaymentStats,
  getAdminPaymentById,
  resolveDispute,
  settleProvider,
  updatePaymentManual,
  listCustomerPayments,
  getProviderEarnings,
};
