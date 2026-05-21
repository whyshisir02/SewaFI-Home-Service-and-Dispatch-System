const redis = require('../config/redis');
const logger = require('../config/logger');

const CACHE_KEYS = {
  servicesCategories: 'services:categories',
  serviceCategory: (slug) => `services:category:${String(slug || '').trim().toLowerCase()}`,
  servicesSubcategories: 'services:subcategories',
  locationsProvinces: 'locations:provinces',
  locationsDistricts: (province) => `locations:districts:${String(province || '').trim().toLowerCase()}`,
  locationsMunicipalities: (province, district) =>
    `locations:municipalities:${String(province || '').trim().toLowerCase()}:${String(district || '').trim().toLowerCase()}`,
  publicFaqs: 'public:faqs',
};

const CACHE_TTL_SECONDS = {
  servicesMeta: 10 * 60,
  locations: 24 * 60 * 60,
  publicFaqs: 10 * 60,
};

let lastRedisConnectAttemptAt = 0;
const REDIS_CONNECT_RETRY_WINDOW_MS = 10_000;

const hasRedisClient = () => Boolean(redis && typeof redis.get === 'function');

const ensureRedisReady = async () => {
  if (!hasRedisClient()) return false;

  if (redis.status === 'ready' || redis.status === 'connecting') {
    return true;
  }

  const now = Date.now();
  if (now - lastRedisConnectAttemptAt < REDIS_CONNECT_RETRY_WINDOW_MS) {
    return false;
  }

  lastRedisConnectAttemptAt = now;

  try {
    await redis.connect();
    return redis.status === 'ready' || redis.status === 'connecting';
  } catch (error) {
    logger.warn(`[cache] Redis connection unavailable: ${error.message}`);
    return false;
  }
};

const safeCacheOperation = async (operation, fallbackValue = null, operationName = 'cache-operation') => {
  try {
    const ready = await ensureRedisReady();
    if (!ready) return fallbackValue;
    return await operation();
  } catch (error) {
    logger.warn(`[cache] ${operationName} failed: ${error.message}`);
    return fallbackValue;
  }
};

const getCache = async (key) => {
  const cached = await safeCacheOperation(() => redis.get(key), null, `get ${key}`);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch (error) {
    logger.warn(`[cache] Failed to parse cache key "${key}": ${error.message}`);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds) => {
  const payload = JSON.stringify(value);
  return safeCacheOperation(
    () => redis.set(key, payload, 'EX', Math.max(1, Number(ttlSeconds) || 1)),
    null,
    `set ${key}`
  );
};

const deleteCache = async (key) => safeCacheOperation(() => redis.del(key), 0, `delete ${key}`);

const deleteManyCache = async (keys = []) => {
  const normalized = [...new Set((keys || []).filter(Boolean))];
  if (!normalized.length) return 0;
  return safeCacheOperation(() => redis.del(...normalized), 0, 'delete many keys');
};

const rememberCache = async (key, ttlSeconds, fetcher) => {
  const cached = await getCache(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
};

module.exports = {
  CACHE_KEYS,
  CACHE_TTL_SECONDS,
  getCache,
  setCache,
  deleteCache,
  deleteManyCache,
  rememberCache,
};

