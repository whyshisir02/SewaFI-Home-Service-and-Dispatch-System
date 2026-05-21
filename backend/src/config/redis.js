// const Redis = require('ioredis');
// const env = require('./env');
// const logger = require('./logger');

// const redis = new Redis(env.REDIS_URL, {
//   retryStrategy(times) {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
//   maxRetriesPerRequest: 3,
// });

// redis.on('connect', () => logger.info('✅ Redis connected'));
// redis.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));
// redis.on('ready', () => logger.info('🚀 Redis ready'));

// module.exports = redis;

const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redisUrl = env.REDIS_URL || process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 50, 500);
      },
    })
  : new Redis({
      host: env.REDIS_HOST || process.env.REDIS_HOST || 'localhost',
      port: Number(env.REDIS_PORT || process.env.REDIS_PORT || 6379),
      password: env.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 50, 500);
      },
    });

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));
redis.on('ready', () => logger.info('🚀 Redis ready'));

module.exports = redis;
