const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { CACHE_KEYS, CACHE_TTL_SECONDS, rememberCache, deleteManyCache } = require('../../utils/cache');

const list = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const where = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  const fetcher = () =>
    prisma.subCategory.findMany({
      where,
      include: { category: true, _count: { select: { services: true } } },
      orderBy: { name: 'asc' },
    });

  const subCategories = categoryId
    ? await fetcher()
    : await rememberCache(CACHE_KEYS.servicesSubcategories, CACHE_TTL_SECONDS.servicesMeta, fetcher);

  res.json(new ApiResponse(200, subCategories, 'Sub-categories fetched'));
});

const create = asyncHandler(async (req, res) => {
  const { name, description, categoryId, icon } = req.body;
  if (!name || !categoryId) throw new ApiError(400, 'Name and categoryId required');

  const sub = await prisma.subCategory.create({
    data: { name, description, categoryId, icon },
    include: { category: true },
  });
  await deleteManyCache([CACHE_KEYS.servicesSubcategories, CACHE_KEYS.servicesCategories]);
  res.status(201).json(new ApiResponse(201, sub, 'Sub-category created'));
});

const update = asyncHandler(async (req, res) => {
  const sub = await prisma.subCategory.update({
    where: { id: req.params.id },
    data: req.body,
  });
  await deleteManyCache([CACHE_KEYS.servicesSubcategories, CACHE_KEYS.servicesCategories]);
  res.json(new ApiResponse(200, sub, 'Updated'));
});

const remove = asyncHandler(async (req, res) => {
  await prisma.subCategory.delete({ where: { id: req.params.id } });
  await deleteManyCache([CACHE_KEYS.servicesSubcategories, CACHE_KEYS.servicesCategories]);
  res.json(new ApiResponse(200, {}, 'Deleted'));
});

module.exports = { list, create, update, remove };
