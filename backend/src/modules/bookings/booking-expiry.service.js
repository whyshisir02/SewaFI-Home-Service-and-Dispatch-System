const { prisma } = require('../../config/database');
const { emitToUser } = require('../../config/socket');
const logger = require('../../config/logger');
const notificationService = require('../../services/notification.service');
const { createStatusHistory } = require('./booking-history.service');

const SYSTEM_STATUS_ACTOR = 'SYSTEM';
const PENDING_EXPIRY_GRACE_MS = 60 * 60 * 1000;
const ACCEPTED_EXPIRY_GRACE_MS = 24 * 60 * 60 * 1000;

const EXPIRED_PENDING_REASON =
  'No provider accepted before the scheduled arrival window expired.';
const EXPIRED_ACCEPTED_REASON =
  'Scheduled service time passed and work did not start within 24 hours.';

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getBookingWindowEnd = (booking) =>
  toValidDate(booking?.scheduledEndTime) || toValidDate(booking?.scheduledTime);

const hasBookingWindowExpired = (booking, now = new Date()) => {
  const windowEnd = getBookingWindowEnd(booking);
  return Boolean(windowEnd && windowEnd.getTime() < now.getTime());
};

const getPendingExpiryTarget = (booking) => {
  const windowEnd = getBookingWindowEnd(booking);
  if (!windowEnd) return null;
  return new Date(windowEnd.getTime() + PENDING_EXPIRY_GRACE_MS);
};

const getAcceptedExpiryTarget = (booking) => {
  const windowEnd = getBookingWindowEnd(booking);
  if (!windowEnd) return null;
  return new Date(windowEnd.getTime() + ACCEPTED_EXPIRY_GRACE_MS);
};

const hasPendingBookingExpired = (booking, now = new Date()) => {
  const expiryTarget = getPendingExpiryTarget(booking);
  return Boolean(expiryTarget && expiryTarget.getTime() <= now.getTime());
};

const hasAcceptedBookingExpired = (booking, now = new Date()) => {
  if (booking?.startedAt) return false;
  const expiryTarget = getAcceptedExpiryTarget(booking);
  return Boolean(expiryTarget && expiryTarget.getTime() <= now.getTime());
};

const getExpiryDecision = (booking, now = new Date()) => {
  const status = String(booking?.status || '').toUpperCase();

  if (status === 'PENDING' && hasPendingBookingExpired(booking, now)) {
    return {
      previousStatus: 'PENDING',
      reason: EXPIRED_PENDING_REASON,
    };
  }

  if (status === 'ACCEPTED' && hasAcceptedBookingExpired(booking, now)) {
    return {
      previousStatus: 'ACCEPTED',
      reason: EXPIRED_ACCEPTED_REASON,
    };
  }

  return null;
};

const buildOverdueWhere = (status, cutoff, bookingId) => ({
  status,
  ...(bookingId ? { id: bookingId } : {}),
  ...(status === 'ACCEPTED' ? { startedAt: null } : {}),
  OR: [
    { scheduledEndTime: { lte: cutoff } },
    {
      AND: [{ scheduledEndTime: null }, { scheduledTime: { lte: cutoff } }],
    },
  ],
});

const notifyExpirySafely = (booking, role) => {
  const userId = role === 'PROVIDER' ? booking?.providerId : booking?.customerId;
  if (!userId) return;

  Promise.resolve(
    notificationService.notifyStatusUpdate(
      userId,
      'EXPIRED',
      booking.bookingCode,
      booking.id,
      role
    )
  ).catch((error) => {
    logger.warn(
      `[booking-expiry] ${role.toLowerCase()} expiry notification failed for booking ${booking.id}: ${error.message}`
    );
  });
};

const expireStaleBookings = async ({ bookingId } = {}) => {
  const now = new Date();
  const pendingCutoff = new Date(now.getTime() - PENDING_EXPIRY_GRACE_MS);
  const acceptedCutoff = new Date(now.getTime() - ACCEPTED_EXPIRY_GRACE_MS);

  const [pendingCandidates, acceptedCandidates] = await Promise.all([
    prisma.booking.findMany({
      where: buildOverdueWhere('PENDING', pendingCutoff, bookingId),
      select: {
        id: true,
        bookingCode: true,
        status: true,
        customerId: true,
        providerId: true,
        scheduledTime: true,
        scheduledEndTime: true,
        startedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: buildOverdueWhere('ACCEPTED', acceptedCutoff, bookingId),
      select: {
        id: true,
        bookingCode: true,
        status: true,
        customerId: true,
        providerId: true,
        scheduledTime: true,
        scheduledEndTime: true,
        startedAt: true,
      },
    }),
  ]);

  const candidates = [...pendingCandidates, ...acceptedCandidates];
  if (!candidates.length) {
    return [];
  }

  const expiredBookings = await prisma.$transaction(async (tx) => {
    const expired = [];

    for (const booking of candidates) {
      const decision = getExpiryDecision(booking, now);
      if (!decision) continue;

      const result = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: decision.previousStatus,
          ...(decision.previousStatus === 'ACCEPTED' ? { startedAt: null } : {}),
        },
        data: {
          status: 'EXPIRED',
          cancelledBy: SYSTEM_STATUS_ACTOR,
          cancelledAt: now,
          cancelReason: decision.reason,
          dispatchState: 'EXPIRED',
        },
      });

      if (result.count !== 1) {
        continue;
      }

      await tx.providerBookingNotification.updateMany({
        where: {
          bookingId: booking.id,
          status: {
            in:
              decision.previousStatus === 'ACCEPTED'
                ? ['NOTIFIED', 'DIRECT', 'ACCEPTED']
                : ['NOTIFIED', 'DIRECT'],
          },
        },
        data: {
          status: 'EXPIRED',
          respondedAt: now,
        },
      });

      if (decision.previousStatus === 'ACCEPTED' && booking.providerId) {
        await tx.providerProfile.updateMany({
          where: { userId: booking.providerId },
          data: { isCurrentlyBusy: false },
        });
      }

      await createStatusHistory({
        bookingId: booking.id,
        status: 'EXPIRED',
        actorUserId: null,
        actorRole: null,
        message: decision.reason,
        tx,
      });

      expired.push({
        ...booking,
        previousStatus: decision.previousStatus,
        reason: decision.reason,
      });
    }

    return expired;
  });

  expiredBookings.forEach((booking) => {
    emitToUser(booking.customerId, 'booking:update', {
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: 'EXPIRED',
      cancelledBy: SYSTEM_STATUS_ACTOR,
      cancelReason: booking.reason,
    });

    if (booking.providerId) {
      emitToUser(booking.providerId, 'booking:update', {
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: 'EXPIRED',
        cancelledBy: SYSTEM_STATUS_ACTOR,
        cancelReason: booking.reason,
      });
    }

    notifyExpirySafely(booking, 'CUSTOMER');

    if (booking.providerId) {
      notifyExpirySafely(booking, 'PROVIDER');
    }
  });

  return expiredBookings;
};

module.exports = {
  SYSTEM_STATUS_ACTOR,
  EXPIRED_PENDING_REASON,
  EXPIRED_ACCEPTED_REASON,
  getBookingWindowEnd,
  hasBookingWindowExpired,
  hasPendingBookingExpired,
  getPendingExpiryTarget,
  getAcceptedExpiryTarget,
  expireStaleBookings,
};
