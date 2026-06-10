const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const notificationService = require('../../services/notification.service');
const { emitToRole, emitToUser } = require('../../config/socket');
const logger = require('../../config/logger');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const { createStatusHistory, getBookingTimeline } = require('./booking-history.service');
const {
  enqueueDispatchCreatedJob,
  enqueueDispatchExpiryJob,
} = require('../../queues/dispatch.queue');
const {
  providerMatchesService,
  getActiveProviderServiceIds,
} = require('../providers/provider-eligibility.service');
const {
  EXPIRED_PENDING_REASON,
  hasPendingBookingExpired,
  getPendingExpiryTarget,
  getAcceptedExpiryTarget,
  expireStaleBookings,
} = require('./booking-expiry.service');

const CANCELLATION_BUFFER_HOURS = 1;
const DISPATCH_ESCALATION_MS = Number(process.env.DISPATCH_ESCALATION_MS || 2 * 60 * 1000);
const dispatchTimers = new Map();
const CUSTOMER_CANCELLATION_BLOCKED_MESSAGE =
  'This booking can no longer be cancelled directly. Please contact support.';

const normalize = (value) => value?.toString().trim().toLowerCase();
const buildAddressText = ({
  streetAddress,
  ward,
  municipality,
  district,
  province,
  landmark,
}) => {
  return [
    streetAddress,
    ward ? `Ward ${ward}` : null,
    municipality,
    district,
    province,
    landmark ? `Landmark: ${landmark}` : null,
  ]
    .filter(Boolean)
    .join(', ');
};

const buildScheduledWindow = ({
  scheduledTime,
  scheduledEndTime,
  preferredDate,
  preferredTime,
  preferredStartTime,
  preferredEndTime,
}) => {
  const startSource =
    scheduledTime ||
    (preferredDate && (preferredStartTime || preferredTime)
      ? `${preferredDate}T${preferredStartTime || preferredTime}:00`
      : null);

  const endSource =
    scheduledEndTime ||
    (preferredDate && preferredEndTime
      ? `${preferredDate}T${preferredEndTime}:00`
      : null);

  if (!startSource) {
    throw new ApiError(400, 'Preferred date and start time are required');
  }

  const start = new Date(startSource);
  const end = endSource ? new Date(endSource) : null;

  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, 'Invalid preferred start time');
  }

  if (start <= new Date()) {
    throw new ApiError(400, 'Preferred start time must be in the future');
  }

  if (end && Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid preferred end time');
  }

  if (end && end <= start) {
    throw new ApiError(400, 'Preferred end time must be after start time');
  }

  return { start, end };
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const parseBookingDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isAwaitingCustomerConfirmationState = (booking) =>
  String(booking?.status || '').trim().toUpperCase() === 'IN_PROGRESS' &&
  String(booking?.paymentStatus || '').trim().toUpperCase() === 'AWAITING_CONFIRMATION';

const getCustomerCancellationEligibility = (booking, now = new Date()) => {
  const status = String(booking?.status || '').trim().toUpperCase();
  const scheduledTime = parseBookingDate(booking?.scheduledTime);

  if (status === 'PENDING') {
    return { allowed: true, reason: 'PENDING' };
  }

  if (status === 'ACCEPTED') {
    if (!scheduledTime) {
      return { allowed: false, reason: 'MISSING_SCHEDULE' };
    }

    const cutoffTime = scheduledTime.getTime() - CANCELLATION_BUFFER_HOURS * 60 * 60 * 1000;
    if (now.getTime() < cutoffTime) {
      return { allowed: true, reason: 'ACCEPTED_OUTSIDE_LOCK_WINDOW' };
    }

    return { allowed: false, reason: 'ACCEPTED_LOCKED' };
  }

  if (isAwaitingCustomerConfirmationState(booking)) {
    return { allowed: false, reason: 'AWAITING_CONFIRMATION' };
  }

  return { allowed: false, reason: status || 'UNSUPPORTED_STATUS' };
};

const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

const resolveBookingAddressSnapshot = async ({ customerId, body, tx = prisma }) => {
  const {
    addressId,
    address,
    province,
    district,
    municipality,
    ward,
    streetAddress,
    landmark,
    latitude,
    longitude,
    addressLabel,
    contactName,
    contactPhone,
  } = body;

  if (addressId) {
    const savedAddress = await tx.customerAddress.findFirst({
      where: {
        id: addressId,
        customerId,
        isActive: true,
      },
    });

    if (!savedAddress) {
      throw new ApiError(404, 'Saved address not found');
    }

    const fullAddress = buildAddressText({
      streetAddress: savedAddress.streetAddress,
      ward: savedAddress.ward,
      municipality: savedAddress.municipality,
      district: savedAddress.district,
      province: savedAddress.province,
      landmark: savedAddress.landmark,
    });

    return {
      address: fullAddress,
      province: savedAddress.province,
      district: savedAddress.district,
      municipality: savedAddress.municipality,
      latitude: savedAddress.latitude,
      longitude: savedAddress.longitude,

      addressLabel: savedAddress.label,
      contactName: savedAddress.fullName,
      contactPhone: savedAddress.phone,

      addressProvince: savedAddress.province,
      addressDistrict: savedAddress.district,
      addressMunicipality: savedAddress.municipality,
      addressWard: savedAddress.ward,
      addressStreet: savedAddress.streetAddress,
      addressLandmark: savedAddress.landmark,
      addressLatitude: savedAddress.latitude,
      addressLongitude: savedAddress.longitude,
    };
  }

  const finalProvince = province;
  const finalDistrict = district;
  const finalMunicipality = municipality;
  const finalStreet = streetAddress || address;

  if (!finalProvince || !finalDistrict || !finalMunicipality || !finalStreet) {
    throw new ApiError(
      400,
      'Address, province, district, and municipality are required'
    );
  }

  const fullAddress =
    address ||
    buildAddressText({
      streetAddress: finalStreet,
      ward,
      municipality: finalMunicipality,
      district: finalDistrict,
      province: finalProvince,
      landmark,
    });

  const parsedLatitude = toNullableNumber(latitude);
  const parsedLongitude = toNullableNumber(longitude);

  return {
    address: fullAddress,
    province: finalProvince,
    district: finalDistrict,
    municipality: finalMunicipality,
    latitude: parsedLatitude,
    longitude: parsedLongitude,

    addressLabel: addressLabel || null,
    contactName: contactName || null,
    contactPhone: contactPhone || null,

    addressProvince: finalProvince,
    addressDistrict: finalDistrict,
    addressMunicipality: finalMunicipality,
    addressWard: ward || null,
    addressStreet: finalStreet,
    addressLandmark: landmark || null,
    addressLatitude: parsedLatitude,
    addressLongitude: parsedLongitude,
  };
};

const runInBackground = (task, context) => {
  try {
    Promise.resolve(task()).catch((error) => {
      logger.error(`${context}: ${error.message}`, { stack: error.stack });
    });
  } catch (error) {
    logger.error(`${context}: ${error.message}`, { stack: error.stack });
  }
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

const getDispatchStageForProvider = (booking, serviceAreas) => {
  const bookingArea = getBookingArea(booking);

  if (serviceAreas.some((area) => isMunicipalityMatch(area, bookingArea))) {
    return 'LOCAL';
  }

  if (!serviceAreas.some((area) => coversBookingArea(area, bookingArea))) {
    return null;
  }

  const dispatchOpenedAt =
    new Date(booking.createdAt).getTime() + DISPATCH_ESCALATION_MS;

  return Date.now() >= dispatchOpenedAt ? 'EXPANDED' : null;
};

const clearDispatchTimer = (bookingId) => {
  const existingTimer = dispatchTimers.get(bookingId);
  if (!existingTimer) return;

  clearTimeout(existingTimer);
  dispatchTimers.delete(bookingId);
};

const scheduleDispatchEscalation = ({
  bookingId,
  serviceName,
  price,
  providerTargets,
  categoryId,
  bookingCode,
  district,
  municipality,
}) => {
  if (!providerTargets.length || dispatchTimers.has(bookingId)) {
    return;
  }

  const timer = setTimeout(async () => {
    dispatchTimers.delete(bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, providerId: true },
    });

    if (!booking || booking.status !== 'PENDING' || booking.providerId) {
      return;
    }

    await prisma.providerBookingNotification.createMany({
      data: providerTargets.map((target) => ({
        bookingId,
        providerProfileId: target.profileId,
        status: 'NOTIFIED',
        batchNumber: 2,
        expiresAt: new Date(Date.now() + DISPATCH_ESCALATION_MS),
      })),
      skipDuplicates: true,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        dispatchState: 'NOTIFIED',
        currentDispatchBatch: 2,
      },
    });

    for (const target of providerTargets) {
      await notificationService.notifyNewJob(
        target.userId,
        serviceName,
        price.toString(),
        bookingId,
        { dispatchPhase: 'EXPANDED' }
      );
      emitToUser(target.userId, 'job:new', {
        bookingId,
        bookingCode,
        serviceName,
        categoryId,
        price,
        targeted: false,
        district,
        municipality,
        dispatchPhase: 'EXPANDED',
      });
    }
  }, DISPATCH_ESCALATION_MS);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  dispatchTimers.set(bookingId, timer);
};

const dispatchBookingImmediatelyFallback = async ({
  booking,
  providerId,
  selectedProvider,
  dispatchProviders,
  service,
  bookingArea,
}) => {
  if (providerId) {
    await prisma.providerBookingNotification.create({
      data: {
        bookingId: booking.id,
        providerProfileId: selectedProvider.providerProfile.id,
        status: 'DIRECT',
        batchNumber: 1,
        expiresAt: new Date(Date.now() + DISPATCH_ESCALATION_MS),
      },
    });

    runInBackground(
      () => notificationService.notifyNewJob(
        providerId,
        service.name,
        service.basePrice.toString(),
        booking.id,
        { dispatchPhase: 'DIRECT' }
      ),
      `Direct booking notification fallback failed for ${booking.id}`
    );

    emitToUser(providerId, 'job:new', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      serviceName: service.name,
      categoryId: service.categoryId,
      price: service.basePrice,
      targeted: true,
      dispatchPhase: 'DIRECT',
    });

    return;
  }

  if (dispatchProviders.firstWave.length) {
    await prisma.providerBookingNotification.createMany({
      data: dispatchProviders.firstWave.map((provider) => ({
        bookingId: booking.id,
        providerProfileId: provider.id,
        status: 'NOTIFIED',
        batchNumber: 1,
        expiresAt: new Date(Date.now() + DISPATCH_ESCALATION_MS),
      })),
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { dispatchState: 'NOTIFIED' },
    });
  }

  for (const provider of dispatchProviders.firstWave) {
    runInBackground(
      () => notificationService.notifyNewJob(
        provider.userId,
        service.name,
        service.basePrice.toString(),
        booking.id,
        { dispatchPhase: 'LOCAL' }
      ),
      `Local dispatch fallback notification failed for ${booking.id}`
    );

    emitToUser(provider.userId, 'job:new', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      serviceName: service.name,
      categoryId: service.categoryId,
      price: service.basePrice,
      targeted: false,
      district: bookingArea.district,
      municipality: bookingArea.municipality,
      dispatchPhase: 'LOCAL',
    });
  }

  scheduleDispatchEscalation({
    bookingId: booking.id,
    serviceName: service.name,
    price: service.basePrice,
    providerTargets: dispatchProviders.secondWave.map((provider) => ({
      profileId: provider.id,
      userId: provider.userId,
    })),
    categoryId: service.categoryId,
    bookingCode: booking.bookingCode,
    district: bookingArea.district,
    municipality: bookingArea.municipality,
  });
};

const providerCanViewPreciseLocation = (providerUserId, booking) =>
  booking.providerId === providerUserId && ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);

const sanitizeBookingForProvider = (booking, providerUserId) => {
  if (providerCanViewPreciseLocation(providerUserId, booking)) {
    return {
      ...booking,
      locationVisibility: 'PRECISE',
    };
  }

  const sanitizedCustomer = booking.customer
    ? {
        ...booking.customer,
        phone: null,
        email: null,
      }
    : booking.customer;

  return {
    ...booking,

    address: null,
    latitude: null,
    longitude: null,
    notes: null,

    addressLabel: null,
    contactName: null,
    contactPhone: null,
    addressStreet: null,
    addressLandmark: null,
    addressLatitude: null,
    addressLongitude: null,

    customer: sanitizedCustomer,
    locationVisibility: 'AREA_ONLY',
    areaLabel:
      [
        booking.addressMunicipality || booking.municipality,
        booking.addressDistrict || booking.district,
      ]
        .filter(Boolean)
        .join(', ') ||
      booking.addressDistrict ||
      booking.district ||
      booking.addressProvince ||
      booking.province ||
      'Service area',
  };
};

const getProviderProfileForUser = async (userId) => {
  return prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { isActive: true } },
      serviceAreas: true,
      services: { select: { serviceId: true, isActive: true } },
    },
  });
};

const providerCanAccessBooking = (profile, booking, providerUserId) => {
  if (!profile || profile.status !== 'APPROVED') {
    return false;
  }

  if (booking.providerId === providerUserId) {
    return true;
  }

  if (booking.status !== 'PENDING' || booking.providerId) {
    return false;
  }

  const serviceMatch = providerMatchesService(profile, booking.service);
  if (!serviceMatch.matches) {
    return false;
  }

  const dispatchPhase = getDispatchStageForProvider(booking, profile.serviceAreas || []);
  const sameArea = (profile.serviceAreas || []).some((area) => coversBookingArea(area, booking));

  return Boolean(dispatchPhase) || sameArea;
};

const createBooking = asyncHandler(async (req, res) => {
  const {
    serviceId,
    providerId,
    scheduledTime,
    scheduledEndTime,
    preferredDate,
    preferredTime,
    preferredStartTime,
    preferredEndTime,
    notes,
  } = req.body;

  if (!serviceId || !scheduledTime) {
    throw new ApiError(400, 'serviceId and scheduledTime are required');
  }

  const addressSnapshot = await resolveBookingAddressSnapshot({
    customerId: req.user.id,
    body: req.body,
  });

  const bookingArea = {
    province: addressSnapshot.addressProvince || addressSnapshot.province,
    district: addressSnapshot.addressDistrict || addressSnapshot.district,
    municipality:
      addressSnapshot.addressMunicipality || addressSnapshot.municipality,
  };

  const hasLatitude = addressSnapshot.latitude !== null;
  const hasLongitude = addressSnapshot.longitude !== null;

  if (hasLatitude !== hasLongitude) {
    throw new ApiError(400, 'Invalid location coordinates');
  }

  if (
    hasLatitude &&
    hasLongitude &&
    (!isValidLatitude(addressSnapshot.latitude) ||
      !isValidLongitude(addressSnapshot.longitude))
  ) {
    throw new ApiError(400, 'Invalid location coordinates');
  }

  const { start: scheduled, end: scheduledEnd } = buildScheduledWindow({
    scheduledTime,
    scheduledEndTime,
    preferredDate,
    preferredTime,
    preferredStartTime,
    preferredEndTime,
  });

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { category: true },
  });
  if (!service) throw new ApiError(404, 'Service not found');

  let selectedProvider = null;
  if (providerId) {
    selectedProvider = await prisma.user.findUnique({
      where: { id: providerId },
      include: {
        providerProfile: {
          include: {
            serviceAreas: true,
            services: { select: { serviceId: true, isActive: true } },
          },
        },
      },
    });

    if (!selectedProvider || selectedProvider.role !== 'PROVIDER' || !selectedProvider.providerProfile) {
      throw new ApiError(404, 'Selected provider not found');
    }
    if (!selectedProvider.isActive) throw new ApiError(400, 'Selected provider is not active');
    if (selectedProvider.providerProfile.status !== 'APPROVED') {
      throw new ApiError(400, 'Selected provider is not approved');
    }
    const directServiceMatch = providerMatchesService(selectedProvider.providerProfile, service);
    if (!directServiceMatch.matches) {
      throw new ApiError(400, 'Selected provider does not offer this service');
    }

    const servesRequestedLocation = selectedProvider.providerProfile.serviceAreas.some((area) =>
      coversBookingArea(area, bookingArea)
    );
    if (!servesRequestedLocation) {
      throw new ApiError(400, 'Selected provider does not serve this booking area');
    }
  }

  const providerAreaWhere = buildProviderAreaWhereForBooking(bookingArea);

  const eligibleProviders = providerId
    ? []
    : await prisma.providerProfile.findMany({
        where: {
          categoryId: service.categoryId,
          services: {
            some: {
              serviceId: service.id,
              isActive: true,
              service: { isActive: true },
            },
          },
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
          serviceAreas: true,
        },
      });

  const dispatchProviders = providerId
    ? { firstWave: [], secondWave: [] }
    : splitProvidersByDispatchStage(eligibleProviders, bookingArea);

  if (!providerId && dispatchProviders.firstWave.length === 0 && dispatchProviders.secondWave.length === 0) {
    throw new ApiError(400, 'No providers currently serve this booking area');
  }

  const booking = await prisma.booking.create({
  data: {
    customerId: req.user.id,
    providerId: providerId || null,
    serviceId,

    address: addressSnapshot.address,
    province: addressSnapshot.province,
    district: addressSnapshot.district,
    municipality: addressSnapshot.municipality,
    latitude: addressSnapshot.latitude,
    longitude: addressSnapshot.longitude,

    addressLabel: addressSnapshot.addressLabel,
    contactName: addressSnapshot.contactName,
    contactPhone: addressSnapshot.contactPhone,

    addressProvince: addressSnapshot.addressProvince,
    addressDistrict: addressSnapshot.addressDistrict,
    addressMunicipality: addressSnapshot.addressMunicipality,
    addressWard: addressSnapshot.addressWard,
    addressStreet: addressSnapshot.addressStreet,
    addressLandmark: addressSnapshot.addressLandmark,
    addressLatitude: addressSnapshot.addressLatitude,
    addressLongitude: addressSnapshot.addressLongitude,

    scheduledTime: scheduled,
    scheduledEndTime: scheduledEnd,
    notes: notes || null,
    basePrice: service.basePrice,
    estimatedAmount: service.basePrice,
    totalPrice: service.basePrice,
    dispatchState: providerId ? 'DIRECT' : 'SEARCHING',
    currentDispatchBatch: 1,
    dispatchQueuedAt: new Date(),
    dispatchStartedAt: new Date(),
  },
  include: {
    service: { include: { category: true, subCategory: true } },
    customer: {
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
      },
    },
  },
});

  await createStatusHistory({
    bookingId: booking.id,
    status: booking.status,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    message: 'Booking created',
  });
  const bookingExpiryTarget = getPendingExpiryTarget({
    scheduledTime: scheduled,
    scheduledEndTime: scheduledEnd,
  });
  let queueEnqueued = false;

  try {
    await enqueueDispatchCreatedJob({ bookingId: booking.id });
    queueEnqueued = true;
  } catch (error) {
    logger.error(
      `[dispatch-queue] Failed to enqueue created job for booking ${booking.id}: ${error.message}`
    );
  }

  if (queueEnqueued) {
    runInBackground(
      () => enqueueDispatchExpiryJob({ bookingId: booking.id, runAt: bookingExpiryTarget }),
      `[dispatch-queue] Failed to enqueue expiry job for booking ${booking.id}`
    );
  } else {
    await dispatchBookingImmediatelyFallback({
      booking,
      providerId,
      selectedProvider,
      dispatchProviders,
      service,
      bookingArea,
    });
  }

  res.status(201).json(new ApiResponse(201, booking, 'Booking created'));
});

const listBookings = asyncHandler(async (req, res) => {
  await expireStaleBookings();

  const { status, search = '', sort = 'newest' } = req.query;
  const { id, role } = req.user;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();

  let where = {};
  if (status) where.status = status;
  if (trimmedSearch) {
    where.OR = [
      { bookingCode: { contains: trimmedSearch, mode: 'insensitive' } },
      { service: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
    ];
  }

  if (role === 'CUSTOMER') {
    where.customerId = id;
  } else if (role === 'PROVIDER') {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: id },
      include: {
        serviceAreas: true,
        services: { select: { serviceId: true, isActive: true } },
      },
    });
    const providerServiceIds = getActiveProviderServiceIds(profile);

    const providerWhere = {
      ...where,
      OR: [
        { providerId: id },
        ...(providerServiceIds.length
          ? [
              {
                providerId: null,
                status: 'PENDING',
                serviceId: { in: providerServiceIds },
              },
            ]
          : []),
      ],
    };

    const bookings = await prisma.booking.findMany({
      where: providerWhere,
      include: {
        service: { include: { category: true, subCategory: true } },
        customer: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        provider: { select: { id: true, name: true, phone: true, avatar: true } },
        review: true,
        payment: true,
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
    });

    const visibleBookings = bookings
      .filter((booking) => providerCanAccessBooking(profile, booking, id))
      .map((booking) => sanitizeBookingForProvider(booking, id));

    const pagedBookings = visibleBookings.slice(skip, skip + take);

    return res.json(
      new ApiResponse(
        200,
        pagedBookings,
        'Bookings fetched',
        buildPaginationMeta({ page, limit, total: visibleBookings.length })
      )
    );
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: { include: { category: true, subCategory: true } },
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        provider: { select: { id: true, name: true, phone: true, avatar: true } },
        review: true,
        payment: true,
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json(new ApiResponse(200, bookings, 'Bookings fetched', buildPaginationMeta({ page, limit, total })));
});

const getAvailableProviderBookings = asyncHandler(async (req, res) => {
  await expireStaleBookings();

  const { search = '', service = '', date = 'all', sort = 'newest' } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const searchNeedle = String(search || '').trim().toLowerCase();

  const matchesDateRange = (value) => {
    if (!value || date === 'all') return true;
    const itemDate = new Date(value);
    if (Number.isNaN(itemDate.getTime())) return false;

    const now = new Date();
    if (date === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (date === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return itemDate.toDateString() === tomorrow.toDateString();
    }
    if (date === 'week') {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return itemDate >= now && itemDate <= weekEnd;
    }
    return true;
  };

  const getSortTime = (booking) => {
    return booking?.scheduledTime || booking?.createdAt || 0;
  };

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    select: {
      id: true,
      categoryId: true,
      status: true,
      availability: true,
      isCurrentlyBusy: true,
      serviceAreas: true,
      services: { select: { serviceId: true, isActive: true } },
      user: { select: { isActive: true } },
    },
  });
  if (!profile) throw new ApiError(404, 'Provider profile not found');
  if (profile.status !== 'APPROVED') throw new ApiError(403, 'Provider is not approved');
  if (profile.user && !profile.user.isActive) throw new ApiError(403, 'Provider account is inactive');
  if (!providerIsAvailable(profile.availability)) throw new ApiError(403, 'Provider is not available');
  const providerServiceIds = getActiveProviderServiceIds(profile);
  if (!providerServiceIds.length) {
    res.json(
      new ApiResponse(
        200,
        [],
        'Please select the services you provide to receive matching jobs.',
        buildPaginationMeta({ page, limit, total: 0 })
      )
    );
    return;
  }
  if (profile.isCurrentlyBusy) {
    res.json(new ApiResponse(200, [], 'Provider is currently busy', buildPaginationMeta({ page, limit, total: 0 })));
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      NOT: {
        providerNotifications: {
          some: {
            providerProfileId: profile.id,
            status: 'REJECTED',
          },
        },
      },
      OR: [
        { providerId: req.user.id },
        {
          providerId: null,
          serviceId: {
            in: providerServiceIds,
          },
        },
      ],
    },
    include: {
      service: { include: { category: true, subCategory: true } },
      customer: { select: { id: true, name: true, phone: true, avatar: true } },
    },
    orderBy: [{ providerId: 'desc' }, { createdAt: 'desc' }],
  });

  let visibleBookings = bookings
    .map((booking) => {
      const serviceMatch = providerMatchesService(profile, booking.service);
      if (!serviceMatch.matches) {
        return null;
      }

      if (booking.providerId === req.user.id) {
        return {
          ...sanitizeBookingForProvider(booking, req.user.id),
          dispatchPhase: 'DIRECT',
        };
      }

      const dispatchPhase = getDispatchStageForProvider(booking, profile.serviceAreas || []);
      if (!dispatchPhase) {
        return null;
      }

      return {
        ...sanitizeBookingForProvider(booking, req.user.id),
        dispatchPhase,
      };
    })
    .filter(Boolean);

  if (service && service !== 'all') {
    const serviceFilter = String(service).toLowerCase();
    visibleBookings = visibleBookings.filter((booking) => {
      const serviceId = String(booking?.service?.id || booking?.serviceId || '').toLowerCase();
      const serviceName = String(booking?.service?.name || '').toLowerCase();
      return serviceId === serviceFilter || serviceName === serviceFilter;
    });
  }

  if (date && date !== 'all') {
    visibleBookings = visibleBookings.filter((booking) =>
      matchesDateRange(booking?.scheduledTime || booking?.createdAt)
    );
  }

  if (searchNeedle) {
    visibleBookings = visibleBookings.filter((booking) => {
      const areaText = [booking?.municipality, booking?.district, booking?.province]
        .filter(Boolean)
        .join(', ')
        .toLowerCase();
      const haystack = `${booking?.bookingCode || ''} ${booking?.service?.name || ''} ${areaText}`.toLowerCase();
      return haystack.includes(searchNeedle);
    });
  }

  visibleBookings.sort((a, b) => {
    if (String(sort).toLowerCase() === 'oldest') {
      return new Date(getSortTime(a)).getTime() - new Date(getSortTime(b)).getTime();
    }
    return new Date(getSortTime(b)).getTime() - new Date(getSortTime(a)).getTime();
  });

  const pagedBookings = visibleBookings.slice(skip, skip + take);
  const meta = buildPaginationMeta({ page, limit, total: visibleBookings.length });

  res.json(new ApiResponse(200, pagedBookings, 'Available provider bookings fetched', meta));
});

const getBooking = asyncHandler(async (req, res) => {
  await expireStaleBookings({ bookingId: req.params.id });

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      service: { include: { category: true, subCategory: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
      provider: {
        select: {
          id: true, name: true, phone: true, avatar: true,
          providerProfile: { select: { averageRating: true, totalJobs: true } },
        },
      },
      review: true,
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (req.user.role === 'CUSTOMER' && booking.customerId !== req.user.id) {
    throw new ApiError(404, 'Booking not found');
  }

  if (req.user.role === 'PROVIDER') {
    const profile = await getProviderProfileForUser(req.user.id);

    if (!providerCanAccessBooking(profile, booking, req.user.id)) {
      throw new ApiError(403, 'Forbidden - Insufficient permissions');
    }

    return res.json(
      new ApiResponse(200, sanitizeBookingForProvider(booking, req.user.id), 'Booking fetched')
    );
  }

  res.json(new ApiResponse(200, booking, 'Booking fetched'));
});

const getBookingTimelineById = asyncHandler(async (req, res) => {
  await expireStaleBookings({ bookingId: req.params.id });

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      service: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (req.user.role === 'CUSTOMER' && booking.customerId !== req.user.id) {
    throw new ApiError(404, 'Booking not found');
  }

  if (req.user.role === 'PROVIDER') {
    const profile = await getProviderProfileForUser(req.user.id);
    if (!providerCanAccessBooking(profile, booking, req.user.id)) {
      throw new ApiError(403, 'Forbidden - Insufficient permissions');
    }
  }

  const timeline = await getBookingTimeline(req.params.id);
  res.json(new ApiResponse(200, timeline, 'Booking timeline fetched'));
});

const acceptBooking = asyncHandler(async (req, res) => {
  await expireStaleBookings({ bookingId: req.params.id });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { isActive: true } },
      serviceAreas: true,
      services: { select: { serviceId: true, isActive: true } },
    },
  });

  if (!profile) throw new ApiError(404, 'Provider profile not found');
  if (profile.status !== 'APPROVED') throw new ApiError(403, 'Not approved');
  if (profile.user && !profile.user.isActive) throw new ApiError(403, 'Provider account is inactive');
  if (!providerIsAvailable(profile.availability)) throw new ApiError(403, 'Provider is not available');
  const providerServiceIds = getActiveProviderServiceIds(profile);
  if (!providerServiceIds.length) {
    throw new ApiError(403, 'Please select the services you provide to receive matching jobs.');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { service: true, customer: true },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (hasPendingBookingExpired(booking)) {
    throw new ApiError(409, EXPIRED_PENDING_REASON);
  }
  if (booking.status === 'ACCEPTED' && booking.providerId === req.user.id) {
    return res.json(new ApiResponse(200, booking, 'Booking accepted'));
  }
  if (booking.status !== 'PENDING') throw new ApiError(409, 'Booking already accepted or unavailable');
  if (profile.isCurrentlyBusy) throw new ApiError(400, 'You have an active job. Complete it first.');
  if (booking.providerId && booking.providerId !== req.user.id) throw new ApiError(403, 'This booking was requested from another provider');
  const existingRejection = await prisma.providerBookingNotification.findFirst({
    where: {
      bookingId: booking.id,
      providerProfileId: profile.id,
      status: 'REJECTED',
    },
    select: { id: true },
  });
  if (existingRejection && booking.providerId !== req.user.id) {
    throw new ApiError(409, 'You already declined this booking');
  }
  const serviceMatch = providerMatchesService(profile, booking.service);
  if (!serviceMatch.matches) {
    throw new ApiError(403, 'This job does not match your approved services.');
  }

  const dispatchPhase = getDispatchStageForProvider(booking, profile.serviceAreas || []);
  const sameArea = (profile.serviceAreas || []).some((area) => coversBookingArea(area, booking));
  const isEligibleByDispatch = Boolean(dispatchPhase);
  const isEligibleByFallback = sameArea && serviceMatch.matches;

  if (!booking.providerId) {
    if (!isEligibleByDispatch && !isEligibleByFallback) {
      logger.debug('Booking accept eligibility rejected', {
        bookingId: booking.id,
        bookingCategoryId: booking.service.categoryId,
        bookingSubCategoryId: booking.service.subCategoryId,
        bookingProvince: booking.province,
        bookingDistrict: booking.district,
        bookingMunicipality: booking.municipality,
        providerProfileId: profile.id,
        providerCategoryId: profile.categoryId,
        providerServiceIds,
        providerAreas: (profile.serviceAreas || []).map((area) => ({
          province: area.province,
          district: area.district,
          municipality: area.municipality,
        })),
        dispatchLogFound: false,
        dispatchPhase,
        sameArea,
        sameCategory: serviceMatch.sameCategory,
        hasSelectedServices: serviceMatch.hasSelectedServices,
        sameService: serviceMatch.sameService,
      });
      throw new ApiError(403, 'This booking is not available in your dispatch area yet');
    }
  }

  const acceptedAt = new Date();
  const acceptanceResult = await prisma.$transaction(async (tx) => {
    const current = await tx.booking.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        providerId: true,
        scheduledTime: true,
        scheduledEndTime: true,
      },
    });

    if (!current) throw new ApiError(404, 'Booking not found');

    if (current.status === 'ACCEPTED' && current.providerId === req.user.id) {
      return { bookingId: current.id, acceptedNow: false };
    }

    if (current.status !== 'PENDING') {
      throw new ApiError(409, 'Booking already accepted or unavailable');
    }

    if (current.providerId && current.providerId !== req.user.id) {
      throw new ApiError(409, 'Booking already assigned to another provider');
    }
    if (hasPendingBookingExpired(current)) {
      throw new ApiError(409, EXPIRED_PENDING_REASON);
    }

    const accepted = await tx.booking.updateMany({
      where: {
        id: req.params.id,
        status: 'PENDING',
        OR: [{ providerId: null }, { providerId: req.user.id }],
      },
      data: {
        providerId: req.user.id,
        status: 'ACCEPTED',
        dispatchState: 'MATCHED',
      },
    });

    if (accepted.count !== 1) {
      throw new ApiError(409, 'Booking already accepted or unavailable');
    }

    await tx.providerProfile.update({
      where: { userId: req.user.id },
      data: { isCurrentlyBusy: true },
    });

    await createStatusHistory({
      bookingId: req.params.id,
      status: 'ACCEPTED',
      actorUserId: req.user.id,
      actorRole: req.user.role,
      message: 'Booking accepted by provider',
      tx,
    });

    return { bookingId: current.id, acceptedNow: true };
  });

  const updated = await prisma.booking.findUnique({
    where: { id: acceptanceResult.bookingId },
    include: {
      customer: true,
      service: true,
      provider: { select: { id: true, name: true, phone: true, avatar: true } },
    },
  });

  if (!updated) {
    throw new ApiError(404, 'Booking not found');
  }

  if (!acceptanceResult.acceptedNow) {
    return res.json(new ApiResponse(200, updated, 'Booking accepted'));
  }

  runInBackground(
    () =>
      prisma.providerBookingNotification.updateMany({
        where: {
          bookingId: req.params.id,
          providerProfileId: profile.id,
        },
        data: {
          status: 'ACCEPTED',
          respondedAt: acceptedAt,
        },
      }),
    `Accept booking provider notification update failed for ${req.params.id}`
  );

  runInBackground(
    () =>
      prisma.providerBookingNotification.updateMany({
        where: {
          bookingId: req.params.id,
          providerProfileId: { not: profile.id },
          status: { in: ['NOTIFIED', 'DIRECT'] },
        },
        data: {
          status: 'EXPIRED',
          respondedAt: acceptedAt,
        },
      }),
    `Accept booking dispatch notification expiry failed for ${req.params.id}`
  );

  // Notify customer with notification + real-time event
  clearDispatchTimer(updated.id);
  runInBackground(
    () => notificationService.notifyBookingAccepted(
      updated.customerId,
      req.user.name,
      updated.bookingCode,
      updated.id
    ),
    `Booking accepted notification failed for ${updated.id}`
  );

  // Emit booking:update to BOTH customer and provider
  emitToUser(updated.customerId, 'booking:update', updated);
  emitToUser(req.user.id, 'booking:update', updated);
  emitToRole('PROVIDER', 'job:taken', { bookingId: updated.id });

  const acceptedExpiryTarget = getAcceptedExpiryTarget(updated);
  if (acceptedExpiryTarget) {
    runInBackground(
      () => enqueueDispatchExpiryJob({ bookingId: updated.id, runAt: acceptedExpiryTarget }),
      `[dispatch-queue] Failed to enqueue accepted expiry job for booking ${updated.id}`
    );
  }

  res.json(new ApiResponse(200, updated, 'Booking accepted'));
});

const rejectBooking = asyncHandler(async (req, res) => {
  await expireStaleBookings({ bookingId: req.params.id });

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { isActive: true } },
      serviceAreas: true,
      services: { select: { serviceId: true, isActive: true } },
    },
  });

  if (!profile) throw new ApiError(404, 'Provider profile not found');
  if (profile.status !== 'APPROVED') throw new ApiError(403, 'Provider is not approved');
  if (profile.user && !profile.user.isActive) throw new ApiError(403, 'Provider account is inactive');

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { service: true },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'ACCEPTED' && booking.providerId === req.user.id) {
    throw new ApiError(409, 'Accepted bookings cannot be declined');
  }
  if (booking.status !== 'PENDING') {
    throw new ApiError(409, 'Booking is no longer available');
  }
  if (hasPendingBookingExpired(booking)) {
    throw new ApiError(409, EXPIRED_PENDING_REASON);
  }
  if (booking.providerId && booking.providerId !== req.user.id) {
    throw new ApiError(409, 'Booking is assigned to another provider');
  }

  const serviceMatch = providerMatchesService(profile, booking.service);
  const sameArea = (profile.serviceAreas || []).some((area) => coversBookingArea(area, booking));
  const dispatchPhase = getDispatchStageForProvider(booking, profile.serviceAreas || []);
  if (!booking.providerId && (!serviceMatch.matches || (!sameArea && !dispatchPhase))) {
    throw new ApiError(403, 'This booking is not available in your dispatch area');
  }

  const existingDecision = await prisma.providerBookingNotification.findFirst({
    where: {
      bookingId: booking.id,
      providerProfileId: profile.id,
      status: 'REJECTED',
    },
    select: { id: true },
  });

  if (existingDecision) {
    return res.json(new ApiResponse(200, { bookingId: booking.id }, 'Booking already declined'));
  }

  await prisma.$transaction(async (tx) => {
    await tx.providerBookingNotification.updateMany({
      where: {
        bookingId: booking.id,
        providerProfileId: profile.id,
      },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    const existing = await tx.providerBookingNotification.findFirst({
      where: {
        bookingId: booking.id,
        providerProfileId: profile.id,
      },
      select: { id: true },
    });

    if (!existing) {
      await tx.providerBookingNotification.create({
        data: {
          bookingId: booking.id,
          providerProfileId: profile.id,
          status: 'REJECTED',
          respondedAt: new Date(),
          batchNumber: Number(booking.currentDispatchBatch || 1),
        },
      });
    }

    if (booking.providerId === req.user.id) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          providerId: null,
          dispatchState: 'SEARCHING',
        },
      });
    }
  });

  res.json(new ApiResponse(200, { bookingId: booking.id }, 'Booking declined successfully'));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['IN_PROGRESS'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { service: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.providerId !== req.user.id) throw new ApiError(403, 'Not your booking');
  if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(booking.status)) {
    throw new ApiError(409, 'This booking cannot be updated');
  }
  if (status === 'IN_PROGRESS' && booking.status === 'IN_PROGRESS') {
    return res.json(new ApiResponse(200, booking, 'Booking already in progress'));
  }
  if (status === 'IN_PROGRESS' && booking.status !== 'ACCEPTED') {
    throw new ApiError(409, 'Only accepted bookings can be started');
  }

  const data = { status };
  if (status === 'IN_PROGRESS') data.startedAt = booking.startedAt || new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: req.params.id },
      data,
      include: {
        service: true,
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        provider: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });

    await tx.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        isCurrentlyBusy: true,
      },
    });

    await createStatusHistory({
      bookingId: req.params.id,
      status,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      message: 'Work started',
      tx,
    });

    return b;
  });

  // Notify customer
  runInBackground(
    () => notificationService.notifyStatusUpdate(
      booking.customerId,
      status,
      booking.bookingCode,
      booking.id,
      'CUSTOMER'
    ),
    `Booking status notification failed for ${booking.id}`
  );

  // Emit real-time updates to both
  emitToUser(booking.customerId, 'booking:update', updated);
  emitToUser(req.user.id, 'booking:update', updated);

  res.json(new ApiResponse(200, updated, 'Status updated'));
});

const startBooking = asyncHandler(async (req, res, next) => {
  req.body.status = 'IN_PROGRESS';
  return updateStatus(req, res, next);
});

const completeBooking = asyncHandler(async (req, res, next) => {
  return next(
    new ApiError(
      409,
      'Direct completion is not allowed. Submit final amount for customer confirmation.'
    )
  );
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { service: true },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== req.user.id) throw new ApiError(403, 'Not yours');
  const now = new Date();
  const cancellationRule = getCustomerCancellationEligibility(booking, now);

  if (!cancellationRule.allowed) {
    throw new ApiError(400, CUSTOMER_CANCELLATION_BLOCKED_MESSAGE);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason || 'No reason',
        cancelledAt: now,
        cancelledBy: req.user.id,
        cancellationFee: null,
      },
      include: {
        service: true,
        customer: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    if (booking.providerId) {
      await tx.providerProfile.update({
        where: { userId: booking.providerId },
        data: { isCurrentlyBusy: false },
      });
    }

    await tx.providerBookingNotification.updateMany({
      where: {
        bookingId: req.params.id,
        status: { in: ['NOTIFIED', 'DIRECT', 'ACCEPTED'] },
      },
      data: {
        status: 'CANCELLED',
        respondedAt: now,
      },
    });

    await createStatusHistory({
      bookingId: req.params.id,
      status: 'CANCELLED',
      actorUserId: req.user.id,
      actorRole: req.user.role,
      message: reason || 'Booking cancelled',
      tx,
    });

    return b;
  });

  if (booking.providerId) {
    runInBackground(
      () => notificationService.notifyStatusUpdate(
        booking.providerId,
        'CANCELLED',
        booking.bookingCode,
        booking.id,
        'PROVIDER'
      ),
      `Booking cancellation notification failed for ${booking.id}`
    );
    emitToUser(booking.providerId, 'booking:update', updated);
  }

  clearDispatchTimer(booking.id);
  emitToUser(req.user.id, 'booking:update', updated);

  res.json(
    new ApiResponse(
      200,
      { ...updated, feeApplied: false, cancellationFee: 0 },
      'Cancelled successfully'
    )
  );
});

const getProviderStats = asyncHandler(async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      category: true,
      subCategories: { include: { subCategory: true } },
      serviceAreas: true,
    },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [today, last7days, thisMonth, thisYear, total, activeBooking] = await Promise.all([
    prisma.booking.aggregate({
      where: { providerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfDay } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: req.user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfMonth } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfYear } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: req.user.id, status: 'COMPLETED' },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.findFirst({
      where: { providerId: req.user.id, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
      include: {
        service: true,
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    }),
  ]);

  res.json(new ApiResponse(200, {
    profile,
    activeBooking,
    earnings: {
      today: { amount: today._sum.totalPrice || 0, count: today._count },
      last7days: { amount: last7days._sum.totalPrice || 0, count: last7days._count },
      thisMonth: { amount: thisMonth._sum.totalPrice || 0, count: thisMonth._count },
      thisYear: { amount: thisYear._sum.totalPrice || 0, count: thisYear._count },
      total: { amount: total._sum.totalPrice || 0, count: total._count },
    },
  }, 'Stats fetched'));
});

const getCustomerStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [today, last7days, thisMonth, thisYear, total, active, completed] = await Promise.all([
    prisma.booking.aggregate({
      where: { customerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfDay } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { customerId: req.user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { customerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfMonth } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { customerId: req.user.id, status: 'COMPLETED', completedAt: { gte: startOfYear } },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.aggregate({
      where: { customerId: req.user.id, status: 'COMPLETED' },
      _sum: { totalPrice: true }, _count: true,
    }),
    prisma.booking.count({
      where: { customerId: req.user.id, status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } },
    }),
    prisma.booking.count({
      where: { customerId: req.user.id, status: 'COMPLETED' },
    }),
  ]);

  res.json(new ApiResponse(200, {
    spending: {
      today: { amount: today._sum.totalPrice || 0, count: today._count },
      last7days: { amount: last7days._sum.totalPrice || 0, count: last7days._count },
      thisMonth: { amount: thisMonth._sum.totalPrice || 0, count: thisMonth._count },
      thisYear: { amount: thisYear._sum.totalPrice || 0, count: thisYear._count },
      total: { amount: total._sum.totalPrice || 0, count: total._count },
    },
    bookings: { active, completed },
  }, 'Stats fetched'));
});

module.exports = {
  createBooking,
  listBookings,
  getAvailableProviderBookings,
  getBooking,
  getBookingTimelineById,
  acceptBooking,
  rejectBooking,
  updateStatus,
  startBooking,
  completeBooking,
  cancelBooking,
  getProviderStats,
  getCustomerStats,
};
