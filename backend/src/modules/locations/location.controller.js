const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { CACHE_KEYS, CACHE_TTL_SECONDS, rememberCache } = require('../../utils/cache');

const getProvinces = asyncHandler(async (req, res) => {
  const result = await rememberCache(CACHE_KEYS.locationsProvinces, CACHE_TTL_SECONDS.locations, () =>
    prisma.nepalLocation.findMany({
      select: { province: true },
      distinct: ['province'],
      orderBy: { province: 'asc' },
    })
  );
  res.json(new ApiResponse(200, result.map(r => r.province), 'Provinces fetched'));
});

const getDistricts = asyncHandler(async (req, res) => {
  const { province } = req.query;
  if (!province) return res.json(new ApiResponse(200, [], 'Province required'));

  const result = await rememberCache(CACHE_KEYS.locationsDistricts(province), CACHE_TTL_SECONDS.locations, () =>
    prisma.nepalLocation.findMany({
      where: { province },
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    })
  );
  res.json(new ApiResponse(200, result.map(r => r.district), 'Districts fetched'));
});

const getMunicipalities = asyncHandler(async (req, res) => {
  const { province, district } = req.query;
  if (!province || !district) {
    return res.json(new ApiResponse(200, [], 'Province and district required'));
  }

  const result = await rememberCache(
    CACHE_KEYS.locationsMunicipalities(province, district),
    CACHE_TTL_SECONDS.locations,
    () =>
      prisma.nepalLocation.findMany({
        where: { province, district },
        select: { municipality: true },
        orderBy: { municipality: 'asc' },
      })
  );
  res.json(new ApiResponse(200, result.map(r => r.municipality), 'Municipalities fetched'));
});

module.exports = { getProvinces, getDistricts, getMunicipalities };
