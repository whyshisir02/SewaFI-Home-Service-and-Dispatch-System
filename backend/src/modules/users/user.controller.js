const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { fileService } = require('../../services/file.service');
const logger = require('../../config/logger');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');

const listUsers = asyncHandler(async (req, res) => {
  const { role, search = '', sort = 'newest' } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();
  const where = {
    ...(role ? { role } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: 'insensitive' } },
            { email: { contains: trimmedSearch, mode: 'insensitive' } },
            { phone: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, avatar: true, createdAt: true,
        province: true, district: true, municipality: true, ward: true, streetAddress: true,
        tempProvince: true, tempDistrict: true, tempMunicipality: true, tempWard: true, tempStreetAddress: true,
        providerProfile: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
  res.json(new ApiResponse(200, users, 'Users fetched', buildPaginationMeta({ page, limit, total })));
});

const toggleActive = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
  });
  res.json(new ApiResponse(200, updated, 'Status updated'));
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');

  const {
    name, phone,
    province, district, municipality, ward, streetAddress,
    tempProvince, tempDistrict, tempMunicipality, tempWard, tempStreetAddress
  } = req.body;

  const data = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (province !== undefined) data.province = province;
  if (district !== undefined) data.district = district;
  if (municipality !== undefined) data.municipality = municipality;
  if (ward !== undefined) data.ward = ward;
  if (streetAddress !== undefined) data.streetAddress = streetAddress;
  if (tempProvince !== undefined) data.tempProvince = tempProvince;
  if (tempDistrict !== undefined) data.tempDistrict = tempDistrict;
  if (tempMunicipality !== undefined) data.tempMunicipality = tempMunicipality;
  if (tempWard !== undefined) data.tempWard = tempWard;
  if (tempStreetAddress !== undefined) data.tempStreetAddress = tempStreetAddress;

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, avatar: true, createdAt: true,
      province: true, district: true, municipality: true, ward: true, streetAddress: true,
      tempProvince: true, tempDistrict: true, tempMunicipality: true, tempWard: true, tempStreetAddress: true,
      providerProfile: {
        include: { category: true },
      },
    },
  });

  res.json(new ApiResponse(200, updated, 'User updated'));
});

// Update own profile (any user)
const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name, phone,
    province, district, municipality, ward, streetAddress,
    tempProvince, tempDistrict, tempMunicipality, tempWard, tempStreetAddress
  } = req.body;

  const data = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (province !== undefined) data.province = province;
  if (district !== undefined) data.district = district;
  if (municipality !== undefined) data.municipality = municipality;
  if (ward !== undefined) data.ward = ward;
  if (streetAddress !== undefined) data.streetAddress = streetAddress;
  if (tempProvince !== undefined) data.tempProvince = tempProvince;
  if (tempDistrict !== undefined) data.tempDistrict = tempDistrict;
  if (tempMunicipality !== undefined) data.tempMunicipality = tempMunicipality;
  if (tempWard !== undefined) data.tempWard = tempWard;
  if (tempStreetAddress !== undefined) data.tempStreetAddress = tempStreetAddress;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      avatar: true,
      province: true, district: true, municipality: true, ward: true, streetAddress: true,
      tempProvince: true, tempDistrict: true, tempMunicipality: true, tempWard: true, tempStreetAddress: true,
    },
  });

  res.json(new ApiResponse(200, updated, 'Profile updated'));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file provided');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.avatarPublicId) await fileService.deleteFromCloudinary(user.avatarPublicId);

  const uploaded = await fileService.uploadProfileImage(req.file, req.user.id);

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: uploaded.url, avatarPublicId: uploaded.publicId },
    select: { id: true, avatar: true },
  });

  res.json(new ApiResponse(200, updated, 'Avatar uploaded'));
});

// Update provider profile
const updateProviderProfile = asyncHandler(async (req, res) => {
  const { experienceYears, bio, expertise, availability, subCategoryIds, serviceAreas } = req.body;

  const data = {};
  if (experienceYears !== undefined) data.experienceYears = parseInt(experienceYears);
  if (bio !== undefined) data.bio = bio;
  if (expertise) data.expertise = typeof expertise === 'string' ? JSON.parse(expertise) : expertise;
  if (availability !== undefined) {
    if (typeof availability === 'object') {
      data.availability = JSON.stringify(availability);
    } else {
      data.availability = availability;
    }
  }

  const profile = await prisma.providerProfile.update({
    where: { userId: req.user.id },
    data,
  });

  // Update sub-categories if provided
  if (subCategoryIds) {
    const ids = typeof subCategoryIds === 'string' ? JSON.parse(subCategoryIds) : subCategoryIds;
    await prisma.providerSubCategory.deleteMany({ where: { providerId: profile.id } });
    if (ids.length > 0) {
      await prisma.providerSubCategory.createMany({
        data: ids.map((subId) => ({ providerId: profile.id, subCategoryId: subId })),
      });
    }
  }

  // Update service areas
  if (serviceAreas) {
    const areas = typeof serviceAreas === 'string' ? JSON.parse(serviceAreas) : serviceAreas;
    await prisma.providerArea.deleteMany({ where: { providerId: profile.id } });
    if (areas.length > 0) {
      await prisma.providerArea.createMany({
        data: areas.map((a) => ({
          providerId: profile.id,
          province: a.province,
          district: a.district,
          municipality: a.municipality || null,
        })),
      });
    }
  }

  // Return updated profile with relations
  const updated = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      category: true,
      subCategories: { include: { subCategory: true } },
      serviceAreas: true,
    },
  });

  res.json(new ApiResponse(200, updated, 'Profile updated'));
});

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      avatar: true,
      province: true, district: true, municipality: true, ward: true, streetAddress: true,
      tempProvince: true, tempDistrict: true, tempMunicipality: true, tempWard: true, tempStreetAddress: true,
      providerProfile: {
        include: {
          category: true,
          subCategories: { include: { subCategory: true } },
          serviceAreas: true,
        },
      },
    },
  });

  if (user?.providerProfile?.availability) {
    const rawAvailability = user.providerProfile.availability;
    if (typeof rawAvailability === 'string') {
      try {
        user.providerProfile.availability = JSON.parse(rawAvailability);
      } catch {
        user.providerProfile.availability = {
          availableToday: rawAvailability.toLowerCase().includes('available'),
          from: '09:00',
          to: '17:00',
        };
      }
    }
  }

  res.json(new ApiResponse(200, user, 'Profile fetched'));
});

const updateProviderAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const normalizedAvailable = available === true || available === 'true';
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    select: { availability: true },
  });
  if (!profile) throw new ApiError(404, 'Provider profile not found');

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

  const updated = await prisma.providerProfile.update({
    where: { userId: req.user.id },
    data: {
      availability: JSON.stringify({
        ...currentAvailability,
        availableToday: normalizedAvailable,
      }),
    },
    select: {
      userId: true,
      availability: true,
      isCurrentlyBusy: true,
    },
  });

  res.json(new ApiResponse(200, updated, 'Availability updated'));
});

const listProviderServices = asyncHandler(async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    select: { id: true, categoryId: true },
  });
  if (!profile) throw new ApiError(404, 'Provider profile not found');

  const services = await prisma.providerService.findMany({
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

  res.json(new ApiResponse(200, services, 'Provider services fetched'));
});

const addProviderService = asyncHandler(async (req, res) => {
  const { serviceId, customPrice } = req.body;
  if (!serviceId) throw new ApiError(400, 'serviceId is required');

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    select: { id: true, categoryId: true, status: true },
  });
  if (!profile) throw new ApiError(404, 'Provider profile not found');
  if (profile.status !== 'APPROVED') throw new ApiError(403, 'Provider is not approved');

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      categoryId: true,
      isActive: true,
    },
  });
  if (!service || !service.isActive) throw new ApiError(404, 'Service not found');
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
  if (existing) throw new ApiError(409, 'Service already added');

  const providerService = await prisma.providerService.create({
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

  res.status(201).json(new ApiResponse(201, providerService, 'Provider service added'));
});

const removeProviderService = asyncHandler(async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'Provider profile not found');

  const existing = await prisma.providerService.findUnique({
    where: {
      providerId_serviceId: {
        providerId: profile.id,
        serviceId: req.params.serviceId,
      },
    },
  });
  if (!existing) throw new ApiError(404, 'Provider service not found');

  await prisma.providerService.delete({
    where: {
      providerId_serviceId: {
        providerId: profile.id,
        serviceId: req.params.serviceId,
      },
    },
  });

  res.json(new ApiResponse(200, {}, 'Provider service removed'));
});

const resubmitProviderApplication = asyncHandler(async (req, res) => {
  if (req.user.role !== 'PROVIDER') {
    throw new ApiError(403, 'Provider access required');
  }

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!providerProfile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  if (providerProfile.status === 'APPROVED') {
    throw new ApiError(400, 'Approved provider profile cannot be resubmitted');
  }

  if (providerProfile.status === 'SUSPENDED') {
    throw new ApiError(403, 'Suspended provider profile cannot be resubmitted');
  }

  const updatedProfile = await prisma.providerProfile.update({
    where: { userId: req.user.id },
    data: {
      status: 'PENDING_APPROVAL',
      rejectionReason: null,
      approvedAt: null,
      approvedBy: null,
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  res.json(
    new ApiResponse(
      200,
      updatedProfile,
      'Provider application resubmitted successfully'
    )
  );
});

const updateProviderDocuments = asyncHandler(async (req, res) => {
  if (req.user.role !== 'PROVIDER') {
    throw new ApiError(403, 'Provider access required');
  }

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!providerProfile) {
    throw new ApiError(404, 'Provider profile not found');
  }

  if (providerProfile.status === 'APPROVED') {
    throw new ApiError(400, 'Approved provider documents cannot be changed here');
  }

  const citizenshipFront = req.files?.citizenshipFront?.[0];
  const citizenshipBack = req.files?.citizenshipBack?.[0];

  if (!citizenshipFront && !citizenshipBack) {
    throw new ApiError(400, 'Please upload at least one document');
  }

  const data = {};

  if (citizenshipFront) {
    data.citizenshipFront =
      citizenshipFront.path ||
      citizenshipFront.secure_url ||
      citizenshipFront.url;

    data.citizenshipFrontPublicId =
      citizenshipFront.filename ||
      citizenshipFront.public_id ||
      citizenshipFront.publicId ||
      providerProfile.citizenshipFrontPublicId;
  }

  if (citizenshipBack) {
    data.citizenshipBack =
      citizenshipBack.path ||
      citizenshipBack.secure_url ||
      citizenshipBack.url;

    data.citizenshipBackPublicId =
      citizenshipBack.filename ||
      citizenshipBack.public_id ||
      citizenshipBack.publicId ||
      providerProfile.citizenshipBackPublicId;
  }

  const updatedProfile = await prisma.providerProfile.update({
    where: { userId: req.user.id },
    data,
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  res.json(
    new ApiResponse(
      200,
      updatedProfile,
      'Provider documents updated successfully'
    )
  );
});

module.exports = {
  listUsers,
  toggleActive,
  updateUserByAdmin,
  updateMyProfile,
  uploadAvatar,
  updateProviderProfile,
  getMyProfile,
  updateProviderAvailability,
  listProviderServices,
  addProviderService,
  removeProviderService,
  resubmitProviderApplication,
  updateProviderDocuments,
};
