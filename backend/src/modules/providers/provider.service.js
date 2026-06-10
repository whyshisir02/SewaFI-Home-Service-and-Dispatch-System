const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { expireStaleBookings } = require('../bookings/booking-expiry.service');

const providerProfileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  category: true,
  subCategories: { include: { subCategory: true } },
  serviceAreas: true,
  services: {
    include: {
      service: {
        include: {
          category: true,
          subCategory: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
};

const parseJsonArray = (value, fallback = []) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return JSON.parse(value);
};

const parseAvailability = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeText = (value) => String(value || '').trim();
const DEFAULT_WORKING_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const ALLOWED_WORKING_DAYS = new Set([
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);
const TIME_24H_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const getMyProviderProfileId = async (userId) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  return profile.id;
};

const normalizeAreaPayload = (payload = {}) => {
  const province = normalizeText(payload.province);
  const district = normalizeText(payload.district);
  const municipality = normalizeText(payload.municipality);

  if (!province || !district) {
    throw new ApiError(400, 'Province and district are required');
  }

  return {
    province,
    district,
    municipality: municipality || null,
  };
};

const buildAreaDuplicateWhere = (providerId, area) => {
  const baseWhere = {
    providerId,
    province: {
      equals: area.province,
      mode: 'insensitive',
    },
    district: {
      equals: area.district,
      mode: 'insensitive',
    },
  };

  if (!area.municipality) {
    return {
      ...baseWhere,
      OR: [{ municipality: null }, { municipality: '' }],
    };
  }

  return {
    ...baseWhere,
    municipality: {
      equals: area.municipality,
      mode: 'insensitive',
    },
  };
};

const getMyProviderProfile = async (userId) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    include: providerProfileInclude,
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  return {
    ...profile,
    availability: parseAvailability(profile.availability),
  };
};

const updateMyProviderProfile = async (userId, payload) => {
  const {
    categoryId,
    experienceYears,
    bio,
    expertise,
    availability,
    subCategoryIds,
    serviceIds,
    serviceAreas,
  } = payload;

  const existingProfile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true, categoryId: true },
  });

  if (!existingProfile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  const nextCategoryId =
    categoryId !== undefined
      ? String(categoryId || '').trim()
      : String(existingProfile.categoryId || '').trim();
  const categoryChanged =
    categoryId !== undefined && String(existingProfile.categoryId) !== String(nextCategoryId);

  if (categoryId !== undefined) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: nextCategoryId },
      select: { id: true, isActive: true },
    });

    if (!category || category.isActive === false) {
      throw new ApiError(400, 'Please select a valid active service category.');
    }
  }

  let normalizedServiceIds = null;
  if (serviceIds !== undefined) {
    const parsedServiceIds = parseJsonArray(serviceIds, []);
    normalizedServiceIds = Array.from(
      new Set(
        (Array.isArray(parsedServiceIds) ? parsedServiceIds : [])
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      )
    );

    if (!normalizedServiceIds.length) {
      throw new ApiError(400, 'Please select at least one service you provide.');
    }

    const matchedServices = await prisma.service.findMany({
      where: {
        id: { in: normalizedServiceIds },
        isActive: true,
        categoryId: nextCategoryId,
      },
      select: { id: true },
    });

    if (matchedServices.length !== normalizedServiceIds.length) {
      throw new ApiError(400, 'Selected services must be active and belong to your selected category.');
    }
  }

  const data = {};
  if (categoryId !== undefined) data.categoryId = nextCategoryId;
  if (experienceYears !== undefined) data.experienceYears = Number.parseInt(experienceYears, 10) || 0;
  if (bio !== undefined) data.bio = bio;
  if (expertise !== undefined) data.expertise = parseJsonArray(expertise, []);
  if (availability !== undefined) {
    data.availability =
      typeof availability === 'object' ? JSON.stringify(availability) : availability;
  }

  await prisma.$transaction(async (tx) => {
    await tx.providerProfile.update({
      where: { userId },
      data,
    });

    if (categoryChanged) {
      await tx.providerService.deleteMany({
        where: { providerId: existingProfile.id },
      });
    }

    if (normalizedServiceIds !== null) {
      await tx.providerService.deleteMany({
        where: { providerId: existingProfile.id },
      });

      await tx.providerService.createMany({
        data: normalizedServiceIds.map((serviceId) => ({
          providerId: existingProfile.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }

    if (subCategoryIds !== undefined) {
      const ids = parseJsonArray(subCategoryIds, []);
      await tx.providerSubCategory.deleteMany({ where: { providerId: existingProfile.id } });

      if (ids.length) {
        await tx.providerSubCategory.createMany({
          data: ids.map((subCategoryId) => ({
            providerId: existingProfile.id,
            subCategoryId,
          })),
        });
      }
    }

    if (serviceAreas !== undefined) {
      const areas = parseJsonArray(serviceAreas, []);
      await tx.providerArea.deleteMany({ where: { providerId: existingProfile.id } });

      if (areas.length) {
        await tx.providerArea.createMany({
          data: areas.map((area) => ({
            providerId: existingProfile.id,
            province: area.province,
            district: area.district,
            municipality: area.municipality || null,
          })),
        });
      }
    }
  });

  return getMyProviderProfile(userId);
};

const updateMyAvailability = async (userId, available) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { availability: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  let currentAvailability = {};
  if (profile.availability) {
    try {
      currentAvailability = JSON.parse(profile.availability);
    } catch {
      currentAvailability = {
        availableToday: !String(profile.availability).toLowerCase().includes('unavailable'),
      };
    }
  }

  return prisma.providerProfile.update({
    where: { userId },
    data: {
      availability: JSON.stringify({
        ...currentAvailability,
        availableToday: available === true || available === 'true',
      }),
    },
    select: {
      userId: true,
      availability: true,
      isCurrentlyBusy: true,
      status: true,
    },
  });
};

const parseAvailabilityObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch {
      return {
        availableToday: !String(value).toLowerCase().includes('unavailable'),
      };
    }
  }

  return {};
};

const timeToMinutes = (value) => {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  return hour * 60 + minute;
};

const normalizeWorkingDays = (workingDays) => {
  if (workingDays === undefined) {
    return DEFAULT_WORKING_DAYS;
  }

  if (!Array.isArray(workingDays)) {
    throw new ApiError(400, 'workingDays must be an array');
  }

  const normalized = Array.from(
    new Set(
      workingDays
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );

  if (!normalized.length) {
    throw new ApiError(400, 'At least one working day is required');
  }

  const invalid = normalized.find((day) => !ALLOWED_WORKING_DAYS.has(day));
  if (invalid) {
    throw new ApiError(400, `Invalid working day: ${invalid}`);
  }

  return normalized;
};

const normalizeSchedulePayload = (payload = {}) => {
  const hasAvailableToday = payload.availableToday !== undefined;
  const hasStartTime = payload.startTime !== undefined;
  const hasEndTime = payload.endTime !== undefined;

  if (
    hasAvailableToday &&
    typeof payload.availableToday !== 'boolean' &&
    payload.availableToday !== 'true' &&
    payload.availableToday !== 'false'
  ) {
    throw new ApiError(400, 'availableToday must be a boolean');
  }

  const startTime = normalizeText(hasStartTime ? payload.startTime : '09:00');
  const endTime = normalizeText(hasEndTime ? payload.endTime : '18:00');

  if (!TIME_24H_PATTERN.test(startTime) || !TIME_24H_PATTERN.test(endTime)) {
    throw new ApiError(400, 'startTime and endTime must be in HH:mm format');
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new ApiError(400, 'startTime must be before endTime');
  }

  return {
    availableToday:
      hasAvailableToday
        ? payload.availableToday === true || payload.availableToday === 'true'
        : true,
    workingDays: normalizeWorkingDays(payload.workingDays),
    startTime,
    endTime,
  };
};

const updateMySchedule = async (userId, payload) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true, availability: true, isCurrentlyBusy: true, status: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  const currentAvailability = parseAvailabilityObject(profile.availability);
  const normalized = normalizeSchedulePayload(payload);

  const nextAvailability = {
    ...currentAvailability,
    availableToday: normalized.availableToday,
    workingDays: normalized.workingDays,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
  };

  return prisma.providerProfile.update({
    where: { userId },
    data: {
      availability: JSON.stringify(nextAvailability),
    },
    select: {
      userId: true,
      availability: true,
      isCurrentlyBusy: true,
      status: true,
    },
  });
};

const getAssignedJobs = async (userId, query = {}) => {
  await expireStaleBookings();

  const { status, search = '', sort = 'newest', date = 'all' } = query;

  const matchesDateRange = (value) => {
    if (!value || date === 'all') return true;
    const itemDate = new Date(value);
    if (Number.isNaN(itemDate.getTime())) return false;

    const now = new Date();
    if (date === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (date === 'week') {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return itemDate >= now && itemDate <= weekEnd;
    }
    if (date === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const where = {
    providerId: userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { bookingCode: { contains: String(search).trim(), mode: 'insensitive' } },
            { service: { name: { contains: String(search).trim(), mode: 'insensitive' } } },
            { customer: { name: { contains: String(search).trim(), mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const jobs = await prisma.booking.findMany({
    where,
    include: {
      service: { include: { category: true, subCategory: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
      review: true,
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
  });

  return jobs.filter((job) => matchesDateRange(job?.scheduledTime || job?.createdAt));
};

const listProviderServices = async (userId) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  return prisma.providerService.findMany({
    where: { providerId: profile.id },
    include: {
      service: {
        include: {
          category: true,
          subCategory: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const addProviderService = async (userId, payload) => {
  const { serviceId, customPrice } = payload;

  if (!serviceId) {
    throw new ApiError(400, 'serviceId is required');
  }

  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true, categoryId: true, status: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, categoryId: true, isActive: true },
  });

  if (!service || !service.isActive) {
    throw new ApiError(404, 'Service not found');
  }

  if (service.categoryId !== profile.categoryId) {
    throw new ApiError(400, 'Service category does not match provider category');
  }

  const existing = await prisma.providerService.findUnique({
    where: {
      providerId_serviceId: {
        providerId: profile.id,
        serviceId,
      },
    },
  });

  if (existing) {
    throw new ApiError(409, 'Service already added');
  }

  return prisma.providerService.create({
    data: {
      providerId: profile.id,
      serviceId,
      customPrice: customPrice !== undefined && customPrice !== '' ? parseFloat(customPrice) : null,
    },
    include: {
      service: {
        include: {
          category: true,
          subCategory: true,
        },
      },
    },
  });
};

const removeProviderService = async (userId, serviceId) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  const existing = await prisma.providerService.findUnique({
    where: {
      providerId_serviceId: {
        providerId: profile.id,
        serviceId,
      },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Provider service not found');
  }

  await prisma.providerService.delete({
    where: {
      providerId_serviceId: {
        providerId: profile.id,
        serviceId,
      },
    },
  });

  return { serviceId };
};

const listProviderAreas = async (userId) => {
  const providerId = await getMyProviderProfileId(userId);

  return prisma.providerArea.findMany({
    where: { providerId },
    orderBy: [
      { province: 'asc' },
      { district: 'asc' },
      { municipality: 'asc' },
    ],
  });
};

const addProviderArea = async (userId, payload) => {
  const providerId = await getMyProviderProfileId(userId);
  const area = normalizeAreaPayload(payload);

  const existing = await prisma.providerArea.findFirst({
    where: buildAreaDuplicateWhere(providerId, area),
  });

  if (existing) {
    throw new ApiError(409, 'This working area is already added');
  }

  return prisma.providerArea.create({
    data: {
      providerId,
      ...area,
    },
  });
};

const removeProviderArea = async (userId, areaId) => {
  const providerId = await getMyProviderProfileId(userId);

  const existing = await prisma.providerArea.findFirst({
    where: {
      id: areaId,
      providerId,
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Working area not found');
  }

  await prisma.providerArea.delete({
    where: { id: areaId },
  });

  return { areaId };
};

module.exports = {
  getMyProviderProfile,
  updateMyProviderProfile,
  updateMyAvailability,
  updateMySchedule,
  getAssignedJobs,
  listProviderServices,
  addProviderService,
  removeProviderService,
  listProviderAreas,
  addProviderArea,
  removeProviderArea,
};
