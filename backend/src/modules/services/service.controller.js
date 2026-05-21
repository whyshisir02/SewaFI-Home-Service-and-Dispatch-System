const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { fileService } = require('../../services/file.service');
const notificationService = require('../../services/notification.service');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const { slugify } = require('../../utils/slugify');
const { CACHE_KEYS, CACHE_TTL_SECONDS, rememberCache, deleteManyCache } = require('../../utils/cache');

const normalizeLocation = (value) => String(value || '').trim().toLowerCase();

const hasLocationFilter = ({ province, district, municipality }) =>
  Boolean(province && district);

const buildProviderAreaWhere = ({ province, district, municipality }) => {
  const nextProvince = String(province || '').trim();
  const nextDistrict = String(district || '').trim();
  const nextMunicipality = String(municipality || '').trim();

  if (!nextProvince || !nextDistrict) {
    return undefined;
  }

  return {
    province: {
      equals: nextProvince,
      mode: 'insensitive',
    },
    district: {
      equals: nextDistrict,
      mode: 'insensitive',
    },
    OR: [
      { municipality: null },
      { municipality: '' },
      ...(nextMunicipality
        ? [
            {
              municipality: {
                equals: nextMunicipality,
                mode: 'insensitive',
              },
            },
          ]
        : []),
    ],
  };
};

const withServiceImageUrl = (service) => {
  if (!service) return service;
  return {
    ...service,
    imageUrl: service.imageUrl || service.image || null,
  };
};

const withCategoryImageUrl = (category) => {
  if (!category) return category;
  return {
    ...category,
    imageUrl: category.imageUrl || null,
  };
};

const parsePrice = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const invalidateServiceMetadataCache = async ({ previousCategorySlug, categorySlug } = {}) => {
  const keys = [
    CACHE_KEYS.servicesCategories,
    CACHE_KEYS.servicesSubcategories,
  ];

  if (previousCategorySlug) {
    keys.push(CACHE_KEYS.serviceCategory(previousCategorySlug));
  }

  if (categorySlug) {
    keys.push(CACHE_KEYS.serviceCategory(categorySlug));
  }

  await deleteManyCache(keys);
};

const listServices = asyncHandler(async (req, res) => {
  const {
    category,
    categorySlug,
    subCategory,
    search,
    sort = 'recommended',
    minPrice,
    maxPrice,
    province,
    district,
    municipality,
  } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const where = { isActive: true };
  const minPriceValue = parsePrice(minPrice);
  const maxPriceValue = parsePrice(maxPrice);
  const providerAreaWhere = buildProviderAreaWhere({
    province,
    district,
    municipality,
  });

  if (category) where.categoryId = category;
  if (subCategory) where.subCategoryId = subCategory;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (categorySlug) {
    where.category = {
      slug: categorySlug,
    };
  }
  if (minPriceValue !== null || maxPriceValue !== null) {
    where.basePrice = {
      ...(minPriceValue !== null ? { gte: minPriceValue } : {}),
      ...(maxPriceValue !== null ? { lte: maxPriceValue } : {}),
    };
  }

  if (providerAreaWhere) {
    where.providerServices = {
      some: {
        isActive: true,
        provider: {
          status: 'APPROVED',
          user: {
            isActive: true,
          },
          serviceAreas: {
            some: providerAreaWhere,
          },
        },
      },
    };
  }

  const normalizedSort = String(sort || '').trim().toLowerCase();
  let orderBy = { createdAt: 'desc' };

  if (normalizedSort === 'price-low' || normalizedSort === 'price_asc' || normalizedSort === 'price-asc') {
    orderBy = { basePrice: 'asc' };
  } else if (normalizedSort === 'price-high' || normalizedSort === 'price_desc' || normalizedSort === 'price-desc') {
    orderBy = { basePrice: 'desc' };
  } else if (normalizedSort === 'name-az' || normalizedSort === 'name_asc' || normalizedSort === 'name') {
    orderBy = { name: 'asc' };
  } else if (normalizedSort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (normalizedSort === 'newest' || normalizedSort === 'recommended') {
    // "recommended" maps to newest until a dedicated recommendation score exists.
    orderBy = { createdAt: 'desc' };
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: true,
        subCategory: true,
      },
      orderBy,
      skip,
      take,
    }),
    prisma.service.count({ where }),
  ]);
  res.json(new ApiResponse(200, services.map(withServiceImageUrl), 'Services fetched', buildPaginationMeta({ page, limit, total })));
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await rememberCache(CACHE_KEYS.servicesCategories, CACHE_TTL_SECONDS.servicesMeta, () =>
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { services: true } },
      },
      orderBy: { name: 'asc' },
    })
  );
  res.json(new ApiResponse(200, categories.map(withCategoryImageUrl), 'Categories fetched'));
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const cacheKey = CACHE_KEYS.serviceCategory(slug);

  const category = await rememberCache(cacheKey, CACHE_TTL_SECONDS.servicesMeta, () =>
    prisma.serviceCategory.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug },
        ],
      },
      include: {
        services: true,
        subCategories: true,
        _count: {
          select: { services: true },
        },
      },
    })
  );

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json(new ApiResponse(200, withCategoryImageUrl(category), 'Category fetched successfully'));
});

const getService = asyncHandler(async (req, res) => {
  const { province, district, municipality } = req.query;

  const providerAreaWhere = buildProviderAreaWhere({
    province,
    district,
    municipality,
  });

  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id: req.params.id }, { slug: req.params.id }],
    },
    include: { category: true, subCategory: true },
  });
  if (!service) throw new ApiError(404, 'Service not found');

  // Get available providers for this category
  const providers = await prisma.providerProfile.findMany({
    where: {
      categoryId: service.categoryId,
      status: 'APPROVED',
      user: { isActive: true },
      ...(providerAreaWhere
        ? {
            serviceAreas: {
              some: providerAreaWhere,
            },
          }
        : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, phone: true, municipality: true, district: true },
      },
      category: true,
      subCategories: {
        include: { subCategory: true },
      },
      serviceAreas: true,
    },
    orderBy: { averageRating: 'desc' },
  });

  res.json(new ApiResponse(200, { service: withServiceImageUrl(service), providers }, 'Service fetched'));
});

const getProvidersByCategory = asyncHandler(async (req, res) => {
  const { categoryId, subCategoryId, district, province, municipality } = req.query;

  const providerAreaWhere = buildProviderAreaWhere({
    province,
    district,
    municipality,
  });

  const where = {
    status: 'APPROVED',
    user: { isActive: true },
  };

  if (categoryId) where.categoryId = categoryId;
  if (subCategoryId) {
    where.subCategories = { some: { subCategoryId } };
  }

  if (providerAreaWhere) {
  where.serviceAreas = {
    some: providerAreaWhere,
  };
}

  const providers = await prisma.providerProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          municipality: true,
          district: true,
          province: true,
        },
      },
      category: true,
      subCategories: { include: { subCategory: true } },
      serviceAreas: true,
    },
    orderBy: { averageRating: 'desc' },
  });

  res.json(new ApiResponse(200, providers, 'Providers fetched'));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, imageUrl, imagePublicId } = req.body;
  const category = await prisma.serviceCategory.create({
    data: {
      name,
      description,
      icon,
      slug: slugify(name),
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
    },
  });
  await invalidateServiceMetadataCache({ categorySlug: category.slug });
  res.status(201).json(new ApiResponse(201, withCategoryImageUrl(category), 'Category created'));
});

const updateCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    icon,
    imageUrl,
    imagePublicId,
    isActive,
  } = req.body;

  const data = {};

  if (name !== undefined) {
    data.name = name;
    data.slug = slugify(name);
  }

  if (description !== undefined) data.description = description;
  if (icon !== undefined) data.icon = icon;
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
  if (imagePublicId !== undefined) data.imagePublicId = imagePublicId || null;
  if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';

  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { id: req.params.id },
    select: { slug: true },
  });

  const category = await prisma.serviceCategory.update({
    where: { id: req.params.id },
    data,
    include: {
      subCategories: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      _count: { select: { services: true } },
    },
  });

  await invalidateServiceMetadataCache({
    previousCategorySlug: existingCategory?.slug,
    categorySlug: category.slug,
  });

  res.json(new ApiResponse(200, withCategoryImageUrl(category), 'Category updated'));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          services: true,
          subCategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (category._count.services > 0 || category._count.subCategories > 0) {
    throw new ApiError(
      400,
      'Cannot delete category with existing services or subcategories. Deactivate it instead.'
    );
  }

  await prisma.serviceCategory.delete({ where: { id: req.params.id } });
  await invalidateServiceMetadataCache({ categorySlug: category.slug });

  res.json(new ApiResponse(200, {}, 'Category deleted'));
});

const createService = asyncHandler(async (req, res) => {
  const { name, description, basePrice, categoryId, subCategoryId, imageUrl, imagePublicId } = req.body;

  let nextImageUrl = req.body.imageUrl || req.body.image || null;
  let nextImagePublicId = req.body.imagePublicId || null;
  if (req.file) {
    const result = await fileService.uploadServiceImage(req.file, 'new');
    nextImageUrl = result.url;
    nextImagePublicId = result.publicId;
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      basePrice: parseFloat(basePrice),
      categoryId,
      subCategoryId: subCategoryId || null,
      slug: slugify(name),
      image: nextImageUrl,
      imagePublicId: nextImagePublicId,
    },
    include: { category: true, subCategory: true },
  });

  await invalidateServiceMetadataCache();

  notificationService.broadcastServiceUpdate('created', service);
  res.status(201).json(new ApiResponse(201, withServiceImageUrl(service), 'Service created'));
});

const updateService = asyncHandler(async (req, res) => {
  const { name, description, basePrice, categoryId, subCategoryId, isActive, imageUrl, imagePublicId } = req.body;

  const data = {};
  if (name) data.name = name;
  if (name) data.slug = slugify(name);
  if (description !== undefined) data.description = description;

  if (basePrice !== undefined) {
    const parsedPrice = parseFloat(basePrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new ApiError(400, 'Base price must be a valid positive number');
    }

    data.basePrice = parsedPrice;
  }

  if (categoryId) data.categoryId = categoryId;
  if (subCategoryId !== undefined) data.subCategoryId = subCategoryId || null;
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;
  if (imageUrl !== undefined) data.image = imageUrl || null;
  if (imagePublicId !== undefined) data.imagePublicId = imagePublicId || null;

  if (req.file) {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (existing.imagePublicId) await fileService.deleteFromCloudinary(existing.imagePublicId);
    const result = await fileService.uploadServiceImage(req.file, req.params.id);
    data.image = result.url;
    data.imagePublicId = result.publicId;
  }

  const service = await prisma.service.update({
    where: { id: req.params.id },
    data,
    include: { category: true, subCategory: true },
  });

  await invalidateServiceMetadataCache();

  notificationService.broadcastServiceUpdate('updated', service);
  res.json(new ApiResponse(200, withServiceImageUrl(service), 'Service updated'));
});

const deleteService = asyncHandler(async (req, res) => {
  const existing = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Service not found');
  }

  if (existing._count.bookings > 0) {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
      include: { category: true, subCategory: true },
    });

    await invalidateServiceMetadataCache();

    return res.json(
      new ApiResponse(
        200,
        withServiceImageUrl(service),
        'Service has bookings, so it was deactivated instead of deleted'
      )
    );
  }

  if (existing.imagePublicId) {
    await fileService.deleteFromCloudinary(existing.imagePublicId);
  }

  await prisma.service.delete({ where: { id: req.params.id } });
  await invalidateServiceMetadataCache();

  notificationService.broadcastServiceUpdate('deleted', { id: req.params.id });

  res.json(new ApiResponse(200, {}, 'Service deleted'));
});

module.exports = {
  listServices,
  getCategories,
  getCategoryBySlug,
  getService,
  getProvidersByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  deleteService,
};
