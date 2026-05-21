const { prisma } = require('../../config/database');
const logger = require('../../config/logger');
const notificationService = require('../../services/notification.service');
const { emitToUser } = require('../../config/socket');
const { createStatusHistory } = require('./booking-history.service');

const SYSTEM_CANCELLED_BY = 'SYSTEM';
const EXPIRED_PENDING_REASON =
  'No provider accepted before the scheduled arrival window expired.';

const normalize = (value) => value?.toString().trim().toLowerCase();

const getBookingWindowEnd = (booking) =>
  booking?.scheduledEndTime || booking?.scheduledTime || null;

const hasBookingWindowExpired = (booking, now = new Date()) => {
  const windowEnd = getBookingWindowEnd(booking);
  if (!windowEnd) return false;
  const endDate = new Date(windowEnd);
  if (Number.isNaN(endDate.getTime())) return false;
  return endDate.getTime() < now.getTime();
};

const getBookingArea = (bookingAreaInput) => ({
  province: bookingAreaInput?.addressProvince || bookingAreaInput?.province,
  district: bookingAreaInput?.addressDistrict || bookingAreaInput?.district,
  municipality:
    bookingAreaInput?.addressMunicipality || bookingAreaInput?.municipality,
});

const coversBookingArea = (area, bookingAreaInput) => {
  const bookingArea = getBookingArea(bookingAreaInput);

  return (
    normalize(area.province) === normalize(bookingArea.province) &&
    normalize(area.district) === normalize(bookingArea.district) &&
    (!area.municipality ||
      normalize(area.municipality) === normalize(bookingArea.municipality))
  );
};

const isMunicipalityMatch = (area, bookingAreaInput) => {
  const bookingArea = getBookingArea(bookingAreaInput);

  return (
    normalize(area.province) === normalize(bookingArea.province) &&
    normalize(area.district) === normalize(bookingArea.district) &&
    normalize(area.municipality) === normalize(bookingArea.municipality)
  );
};

const buildProviderAreaWhereForBooking = (bookingArea) => {
  const province = String(bookingArea?.province || '').trim();
  const district = String(bookingArea?.district || '').trim();
  const municipality = String(bookingArea?.municipality || '').trim();

  if (!province || !district) {
    return undefined;
  }

  return {
    province: {
      equals: province,
      mode: 'insensitive',
    },
    district: {
      equals: district,
      mode: 'insensitive',
    },
    OR: [
      { municipality: null },
      { municipality: '' },
      ...(municipality
        ? [
            {
              municipality: {
                equals: municipality,
                mode: 'insensitive',
              },
            },
          ]
        : []),
    ],
  };
};

const providerIsAvailable = (availability) => {
  if (!availability) return true;

  if (typeof availability === 'object') {
    return availability.availableToday !== false;
  }

  try {
    const parsed = JSON.parse(availability);
    return parsed.availableToday !== false;
  } catch {
    return !String(availability).toLowerCase().includes('unavailable');
  }
};

const splitProvidersByDispatchStage = (providers, bookingArea) => {
  const firstWave = [];
  const secondWave = [];

  providers.forEach((provider) => {
    const areas = provider.serviceAreas || [];
    if (!areas.some((area) => coversBookingArea(area, bookingArea))) {
      return;
    }

    if (areas.some((area) => isMunicipalityMatch(area, bookingArea))) {
      firstWave.push(provider);
      return;
    }

    secondWave.push(provider);
  });

  if (firstWave.length === 0) {
    return { firstWave: secondWave, secondWave: [] };
  }

  return { firstWave, secondWave };
};

const loadBookingForDispatch = async (bookingId) =>
  prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      provider: {
        select: {
          id: true,
          isActive: true,
          providerProfile: {
            select: { id: true, status: true },
          },
        },
      },
    },
  });

const shouldSkipDispatch = (booking) =>
  !booking ||
  booking.status !== 'PENDING' ||
  ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status) ||
  Boolean(booking.providerId && booking.provider?.providerProfile?.status !== 'APPROVED');

const notifyProviderForJob = async ({ booking, provider, dispatchPhase, targeted = false }) => {
  const servicePrice = booking?.service?.basePrice ?? booking?.basePrice ?? 0;
  const servicePriceText = servicePrice?.toString ? servicePrice.toString() : String(servicePrice);
  try {
    await notificationService.notifyNewJob(
      provider.userId,
      booking.service.name,
      servicePriceText,
      booking.id,
      { dispatchPhase }
    );
  } catch (error) {
    logger.warn(
      `[dispatch] Notification create failed for provider ${provider.userId} on booking ${booking.id}: ${error.message}`
    );
  }

  emitToUser(provider.userId, 'job:new', {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    serviceName: booking.service.name,
    categoryId: booking.service.categoryId,
    price: servicePrice,
    targeted,
    district: booking.addressDistrict || booking.district,
    municipality: booking.addressMunicipality || booking.municipality,
    dispatchPhase,
  });
};

const recordProviderDispatchNotification = async ({
  tx,
  bookingId,
  providerProfileId,
  status,
  batchNumber,
  expiresAt,
}) => {
  const existing = await tx.providerBookingNotification.findFirst({
    where: {
      bookingId,
      providerProfileId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.status === 'REJECTED') {
    return { created: false, skipped: 'REJECTED' };
  }

  if (existing) {
    return { created: false, skipped: existing.status };
  }

  await tx.providerBookingNotification.create({
    data: {
      bookingId,
      providerProfileId,
      status,
      batchNumber,
      expiresAt,
    },
  });

  return { created: true };
};

const expirePendingBookingById = async (bookingId) => {
  const now = new Date();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingCode: true,
      status: true,
      customerId: true,
      providerId: true,
    },
  });

  if (!booking || booking.status !== 'PENDING') {
    return { expired: false, reason: 'NOT_PENDING' };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: booking.id, status: 'PENDING' },
      data: {
        status: 'CANCELLED',
        cancelledBy: SYSTEM_CANCELLED_BY,
        cancelledAt: now,
        cancelReason: EXPIRED_PENDING_REASON,
        dispatchState: 'EXPIRED',
      },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.providerBookingNotification.updateMany({
      where: {
        bookingId: booking.id,
        status: { in: ['NOTIFIED', 'DIRECT'] },
      },
      data: {
        status: 'EXPIRED',
        respondedAt: now,
      },
    });

    await createStatusHistory({
      bookingId: booking.id,
      status: 'CANCELLED',
      actorUserId: null,
      actorRole: null,
      message: EXPIRED_PENDING_REASON,
      tx,
    });

    return true;
  });

  if (!updated) {
    return { expired: false, reason: 'RACE' };
  }

  emitToUser(booking.customerId, 'booking:update', {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: 'CANCELLED',
    cancelledBy: SYSTEM_CANCELLED_BY,
    cancelReason: EXPIRED_PENDING_REASON,
  });

  try {
    await notificationService.notifyStatusUpdate(
      booking.customerId,
      'CANCELLED',
      booking.bookingCode,
      booking.id,
      'CUSTOMER'
    );
  } catch (error) {
    logger.warn(`[dispatch] Customer expiry notification failed for booking ${booking.id}: ${error.message}`);
  }

  return { expired: true };
};

const processDispatchCreated = async (bookingId, options = {}) => {
  const escalationMs = Number(options.escalationMs || 2 * 60 * 1000);
  const booking = await loadBookingForDispatch(bookingId);

  if (shouldSkipDispatch(booking)) {
    return { skipped: true, reason: 'BOOKING_NOT_DISPATCHABLE', secondWaveCount: 0 };
  }

  if (hasBookingWindowExpired(booking)) {
    await expirePendingBookingById(bookingId);
    return { skipped: true, reason: 'BOOKING_EXPIRED', secondWaveCount: 0 };
  }

  if (booking.providerId && booking.provider?.providerProfile?.status === 'APPROVED') {
    const expiresAt = new Date(Date.now() + escalationMs);

    const recordResult = await prisma.$transaction((tx) =>
      recordProviderDispatchNotification({
        tx,
        bookingId: booking.id,
        providerProfileId: booking.provider.providerProfile.id,
        status: 'DIRECT',
        batchNumber: 1,
        expiresAt,
      })
    );

    if (recordResult.created) {
      await notifyProviderForJob({
        booking,
        provider: {
          userId: booking.providerId,
          id: booking.provider.providerProfile.id,
        },
        dispatchPhase: 'DIRECT',
        targeted: true,
      });
    }

    return { dispatched: true, direct: true, secondWaveCount: 0 };
  }

  const bookingArea = getBookingArea(booking);
  const providerAreaWhere = buildProviderAreaWhereForBooking(bookingArea);
  const eligibleProviders = await prisma.providerProfile.findMany({
    where: {
      categoryId: booking.service.categoryId,
      status: 'APPROVED',
      isCurrentlyBusy: false,
      user: { isActive: true },
      ...(providerAreaWhere
        ? {
            serviceAreas: {
              some: providerAreaWhere,
            },
          }
        : {}),
    },
    select: {
      id: true,
      userId: true,
      availability: true,
      serviceAreas: true,
    },
  });

  const availableProviders = eligibleProviders.filter((provider) =>
    providerIsAvailable(provider.availability)
  );
  const { firstWave, secondWave } = splitProvidersByDispatchStage(
    availableProviders,
    bookingArea
  );

  const firstWaveToNotify = [];
  const expiresAt = new Date(Date.now() + escalationMs);

  await prisma.$transaction(async (tx) => {
    for (const provider of firstWave) {
      const record = await recordProviderDispatchNotification({
        tx,
        bookingId: booking.id,
        providerProfileId: provider.id,
        status: 'NOTIFIED',
        batchNumber: 1,
        expiresAt,
      });

      if (record.created) {
        firstWaveToNotify.push(provider);
      }
    }

    if (firstWaveToNotify.length > 0) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          dispatchState: 'NOTIFIED',
          currentDispatchBatch: 1,
        },
      });
    }
  });

  for (const provider of firstWaveToNotify) {
    await notifyProviderForJob({
      booking,
      provider,
      dispatchPhase: 'LOCAL',
      targeted: false,
    });
  }

  return {
    dispatched: true,
    direct: false,
    firstWaveCount: firstWaveToNotify.length,
    secondWaveCount: secondWave.length,
  };
};

const processDispatchEscalation = async (bookingId, options = {}) => {
  const escalationMs = Number(options.escalationMs || 2 * 60 * 1000);
  const booking = await loadBookingForDispatch(bookingId);

  if (shouldSkipDispatch(booking)) {
    return { skipped: true, reason: 'BOOKING_NOT_DISPATCHABLE' };
  }

  if (hasBookingWindowExpired(booking)) {
    await expirePendingBookingById(bookingId);
    return { skipped: true, reason: 'BOOKING_EXPIRED' };
  }

  const bookingArea = getBookingArea(booking);
  const providerAreaWhere = buildProviderAreaWhereForBooking(bookingArea);
  const eligibleProviders = await prisma.providerProfile.findMany({
    where: {
      categoryId: booking.service.categoryId,
      status: 'APPROVED',
      isCurrentlyBusy: false,
      user: { isActive: true },
      ...(providerAreaWhere
        ? {
            serviceAreas: {
              some: providerAreaWhere,
            },
          }
        : {}),
    },
    select: {
      id: true,
      userId: true,
      availability: true,
      serviceAreas: true,
    },
  });

  const availableProviders = eligibleProviders.filter((provider) =>
    providerIsAvailable(provider.availability)
  );
  const { secondWave } = splitProvidersByDispatchStage(availableProviders, bookingArea);
  if (!secondWave.length) {
    return { dispatched: false, reason: 'NO_SECOND_WAVE' };
  }

  const secondWaveToNotify = [];
  const expiresAt = new Date(Date.now() + escalationMs);

  await prisma.$transaction(async (tx) => {
    for (const provider of secondWave) {
      const record = await recordProviderDispatchNotification({
        tx,
        bookingId: booking.id,
        providerProfileId: provider.id,
        status: 'NOTIFIED',
        batchNumber: 2,
        expiresAt,
      });

      if (record.created) {
        secondWaveToNotify.push(provider);
      }
    }

    if (secondWaveToNotify.length > 0) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          dispatchState: 'NOTIFIED',
          currentDispatchBatch: 2,
        },
      });
    }
  });

  for (const provider of secondWaveToNotify) {
    await notifyProviderForJob({
      booking,
      provider,
      dispatchPhase: 'EXPANDED',
      targeted: false,
    });
  }

  return {
    dispatched: true,
    secondWaveCount: secondWaveToNotify.length,
  };
};

module.exports = {
  EXPIRED_PENDING_REASON,
  getBookingWindowEnd,
  hasBookingWindowExpired,
  processDispatchCreated,
  processDispatchEscalation,
  expirePendingBookingById,
};
