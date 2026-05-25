const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const hasCoordinateValue = (value) =>
  value !== undefined && value !== null && value !== '';

const toNullableNumber = (value) => {
  if (!hasCoordinateValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

const validateCoordinatePair = (latitude, longitude) => {
  const hasLatitude = latitude !== null;
  const hasLongitude = longitude !== null;

  if (hasLatitude !== hasLongitude) {
    throw new ApiError(
      400,
      'Both latitude and longitude are required when saving GPS location.'
    );
  }

  if (!hasLatitude && !hasLongitude) return;

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new ApiError(400, 'Invalid location coordinates.');
  }
};

const listCustomerAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.customerAddress.findMany({
    where: {
      customerId: req.user.id,
      isActive: true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  res.json(new ApiResponse(200, addresses, 'Addresses fetched successfully'));
});

const createCustomerAddress = asyncHandler(async (req, res) => {
  const {
    label,
    fullName,
    phone,
    province,
    district,
    municipality,
    ward,
    streetAddress,
    landmark,
    latitude,
    longitude,
    isDefault,
  } = req.body;

  if (!province || !district || !municipality || !streetAddress) {
    throw new ApiError(
      400,
      'Province, district, municipality, and street address are required'
    );
  }

  const parsedLatitude = toNullableNumber(latitude);
  const parsedLongitude = toNullableNumber(longitude);
  validateCoordinatePair(parsedLatitude, parsedLongitude);

  const addressCount = await prisma.customerAddress.count({
    where: {
      customerId: req.user.id,
      isActive: true,
    },
  });

  const shouldBeDefault = Boolean(isDefault) || addressCount === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.customerAddress.updateMany({
        where: {
          customerId: req.user.id,
          isActive: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.customerAddress.create({
      data: {
        customerId: req.user.id,
        label: label || 'Address',
        fullName: fullName || req.user.name || null,
        phone: phone || null,
        province,
        district,
        municipality,
        ward: ward || null,
        streetAddress,
        landmark: landmark || null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        isDefault: shouldBeDefault,
      },
    });
  });

  res
    .status(201)
    .json(new ApiResponse(201, address, 'Address created successfully'));
});

const updateCustomerAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.customerAddress.findFirst({
    where: {
      id,
      customerId: req.user.id,
      isActive: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Address not found');
  }

  const {
    label,
    fullName,
    phone,
    province,
    district,
    municipality,
    ward,
    streetAddress,
    landmark,
    latitude,
    longitude,
    isDefault,
  } = req.body;

  const parsedLatitude =
    latitude !== undefined ? toNullableNumber(latitude) : existing.latitude;
  const parsedLongitude =
    longitude !== undefined ? toNullableNumber(longitude) : existing.longitude;
  validateCoordinatePair(parsedLatitude, parsedLongitude);

  const shouldBeDefault = Boolean(isDefault);

  const address = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.customerAddress.updateMany({
        where: {
          customerId: req.user.id,
          isActive: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.customerAddress.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(province !== undefined && { province }),
        ...(district !== undefined && { district }),
        ...(municipality !== undefined && { municipality }),
        ...(ward !== undefined && { ward: ward || null }),
        ...(streetAddress !== undefined && { streetAddress }),
        ...(landmark !== undefined && { landmark: landmark || null }),
        ...(latitude !== undefined && {
          latitude: parsedLatitude,
        }),
        ...(longitude !== undefined && {
          longitude: parsedLongitude,
        }),
        ...(isDefault !== undefined && { isDefault: shouldBeDefault }),
      },
    });
  });

  res.json(new ApiResponse(200, address, 'Address updated successfully'));
});

const deleteCustomerAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.customerAddress.findFirst({
    where: {
      id,
      customerId: req.user.id,
      isActive: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Address not found');
  }

  await prisma.customerAddress.update({
    where: { id },
    data: {
      isActive: false,
      isDefault: false,
    },
  });

  res.json(new ApiResponse(200, {}, 'Address deleted successfully'));
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.customerAddress.findFirst({
    where: {
      id,
      customerId: req.user.id,
      isActive: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Address not found');
  }

  const address = await prisma.$transaction(async (tx) => {
    await tx.customerAddress.updateMany({
      where: {
        customerId: req.user.id,
        isActive: true,
      },
      data: {
        isDefault: false,
      },
    });

    return tx.customerAddress.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });
  });

  res.json(new ApiResponse(200, address, 'Default address updated successfully'));
});

module.exports = {
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
};
