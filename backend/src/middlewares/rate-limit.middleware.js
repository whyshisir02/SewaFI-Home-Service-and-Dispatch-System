const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');

const RATE_LIMIT_MESSAGE = {
  success: false,
  message: 'Too many requests. Please try again later.',
};

const buildSafeHandler = () => (req, res) => {
  res.status(429).json(RATE_LIMIT_MESSAGE);
};

class RedisRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false;
    this.windowMs = 60_000;
    this.memoryStore = new rateLimit.MemoryStore();
    this.lastConnectAttemptAt = 0;
    this.connectRetryWindowMs = 10_000;
  }

  init(options) {
    this.windowMs = Number(options?.windowMs) || this.windowMs;
    this.memoryStore.init?.(options);
  }

  async canUseRedis() {
    if (!redis || typeof redis.get !== 'function') return false;
    if (redis.status === 'ready' || redis.status === 'connecting') return true;

    const now = Date.now();
    if (now - this.lastConnectAttemptAt < this.connectRetryWindowMs) {
      return false;
    }
    this.lastConnectAttemptAt = now;

    try {
      await redis.connect();
      return redis.status === 'ready' || redis.status === 'connecting';
    } catch (error) {
      logger.warn(`[rate-limit] Redis unavailable, using memory fallback: ${error.message}`);
      return false;
    }
  }

  toRedisKey(key) {
    return `${this.prefix}${key}`;
  }

  async increment(key) {
    if (!(await this.canUseRedis())) {
      return this.memoryStore.increment(key);
    }

    const redisKey = this.toRedisKey(key);

    try {
      const txResult = await redis
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();

      const totalHits = Number(txResult?.[0]?.[1] || 0);
      let ttlMs = Number(txResult?.[1]?.[1] || -1);

      if (ttlMs < 0) {
        await redis.pexpire(redisKey, this.windowMs);
        ttlMs = this.windowMs;
      }

      return {
        totalHits,
        resetTime: new Date(Date.now() + Math.max(ttlMs, 0)),
      };
    } catch (error) {
      logger.warn(`[rate-limit] Redis increment failed, using memory fallback: ${error.message}`);
      return this.memoryStore.increment(key);
    }
  }

  async decrement(key) {
    if (!(await this.canUseRedis())) {
      return this.memoryStore.decrement(key);
    }

    try {
      await redis.decr(this.toRedisKey(key));
    } catch (error) {
      logger.warn(`[rate-limit] Redis decrement failed: ${error.message}`);
      this.memoryStore.decrement(key);
    }
  }

  async resetKey(key) {
    if (!(await this.canUseRedis())) {
      return this.memoryStore.resetKey(key);
    }

    try {
      await redis.del(this.toRedisKey(key));
    } catch (error) {
      logger.warn(`[rate-limit] Redis resetKey failed: ${error.message}`);
      this.memoryStore.resetKey(key);
    }
  }
}

const createLimiter = ({ windowMs, productionLimit, developmentLimit, prefix }) =>
  rateLimit({
    windowMs,
    limit: env.NODE_ENV === 'production' ? productionLimit : developmentLimit,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisRateLimitStore(prefix),
    handler: buildSafeHandler(),
    message: RATE_LIMIT_MESSAGE,
    validate: { default: true },
  });

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  productionLimit: 300,
  developmentLimit: 1000,
  prefix: 'rl:api:',
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  productionLimit: 120,
  developmentLimit: 600,
  prefix: 'rl:auth:',
});

const authActionLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  productionLimit: 20,
  developmentLimit: 200,
  prefix: 'rl:auth-action:',
});

const bookingCreateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  productionLimit: 25,
  developmentLimit: 250,
  prefix: 'rl:booking-create:',
});

const reviewCreateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  productionLimit: 20,
  developmentLimit: 200,
  prefix: 'rl:review-create:',
});

module.exports = {
  RATE_LIMIT_MESSAGE,
  apiLimiter,
  authLimiter,
  authActionLimiter,
  bookingCreateLimiter,
  reviewCreateLimiter,
};

