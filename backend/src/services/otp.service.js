const crypto = require('crypto');
const redis = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const REDIS_OP_TIMEOUT_MS = 3000;

const normalizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

const normalizeOtp = (otp) => {
  return String(otp || '').replace(/\s/g, '').trim();
};

const hashOTP = (otp) => {
  return crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex');
};

const getOtpKey = (type, email) => `otp:${type}:${email}`;
const getRequestAttemptsKey = (type, email) => `otp:request_attempts:${type}:${email}`;
const getVerifyAttemptsKey = (type, email) => `otp:verify_attempts:${type}:${email}`;
const getVerifiedKey = (email) => `verified:${email}`;

const withRedisTimeout = (promise, opName) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Redis timeout during ${opName}`)), REDIS_OP_TIMEOUT_MS);
    }),
  ]);

const safeRedis = async (operation, opName) => {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await withRedisTimeout(redis.connect(), 'redis.connect');
    }
    return await withRedisTimeout(operation(), opName);
  } catch (error) {
    logger.error(`OTP Redis operation failed (${opName}): ${error.message}`);
    throw new ApiError(503, 'OTP verification service is temporarily unavailable. Please try again.');
  }
};

const otpService = {
  generateOTP: () => crypto.randomInt(100000, 1000000).toString(),

  sendOTP: async (email, type = 'register') => {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      throw new ApiError(400, 'Email is required');
    }

    const requestAttemptsKey = getRequestAttemptsKey(type, cleanEmail);
    const attempts = await safeRedis(() => redis.get(requestAttemptsKey), 'get-request-attempts');

    if (attempts && parseInt(attempts, 10) >= env.OTP.MAX_ATTEMPTS) {
      throw new ApiError(429, 'Too many OTP requests. Try again in 1 hour.');
    }

    const otp = otpService.generateOTP();
    const otpHash = hashOTP(otp);
    const otpKey = getOtpKey(type, cleanEmail);

    await safeRedis(
      () => redis.setex(otpKey, env.OTP.EXPIRY_MINUTES * 60, otpHash),
      'set-otp'
    );

    const newAttempts = attempts ? parseInt(attempts, 10) + 1 : 1;
    await safeRedis(
      () => redis.setex(requestAttemptsKey, 3600, newAttempts.toString()),
      'set-request-attempts'
    );

    await safeRedis(
      () => redis.del(getVerifyAttemptsKey(type, cleanEmail)),
      'clear-verify-attempts'
    );

    logger.info(`OTP generated for ${cleanEmail} with type=${type}`);

    return otp;
  },

  verifyOTP: async (email, otp, type = 'register') => {
    const cleanEmail = normalizeEmail(email);
    const cleanOtp = normalizeOtp(otp);

    if (!cleanEmail || !cleanOtp) {
      throw new ApiError(400, 'Email and OTP are required');
    }

    const otpKey = getOtpKey(type, cleanEmail);
    const verifyAttemptsKey = getVerifyAttemptsKey(type, cleanEmail);

    const verifyAttempts = await safeRedis(
      () => redis.get(verifyAttemptsKey),
      'get-verify-attempts'
    );

    if (verifyAttempts && parseInt(verifyAttempts, 10) >= env.OTP.MAX_ATTEMPTS) {
      await safeRedis(() => redis.del(otpKey), 'delete-otp-on-max-attempts');
      throw new ApiError(429, 'Too many incorrect OTP attempts. Please request a new OTP.');
    }

    const storedHash = await safeRedis(() => redis.get(otpKey), 'get-otp');

    if (!storedHash) {
      throw new ApiError(400, 'OTP expired or invalid');
    }

    const incomingHash = hashOTP(cleanOtp);

    if (storedHash !== incomingHash) {
      const newAttempts = verifyAttempts ? parseInt(verifyAttempts, 10) + 1 : 1;

      await safeRedis(
        () =>
          redis.setex(
            verifyAttemptsKey,
            env.OTP.EXPIRY_MINUTES * 60,
            newAttempts.toString()
          ),
        'set-verify-attempts'
      );

      throw new ApiError(400, 'Incorrect OTP');
    }

    await safeRedis(() => redis.del(otpKey), 'delete-otp');
    await safeRedis(() => redis.del(verifyAttemptsKey), 'delete-verify-attempts');
    await otpService.clearAttempts(cleanEmail, type);

    return true;
  },

  createVerificationToken: async (email) => {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      throw new ApiError(400, 'Email is required');
    }

    const token = crypto.randomBytes(32).toString('hex');

    await safeRedis(
      () => redis.setex(getVerifiedKey(cleanEmail), 30 * 60, token),
      'set-verification-token'
    );

    return token;
  },

  verifyToken: async (email, token) => {
    const cleanEmail = normalizeEmail(email);
    const cleanToken = String(token || '').trim();

    const stored = await safeRedis(
      () => redis.get(getVerifiedKey(cleanEmail)),
      'get-verification-token'
    );

    if (!stored || stored !== cleanToken) {
      throw new ApiError(400, 'Verification expired. Please verify OTP again.');
    }

    return true;
  },

  deleteVerificationToken: async (email) => {
    const cleanEmail = normalizeEmail(email);

    await safeRedis(() => redis.del(getVerifiedKey(cleanEmail)), 'delete-verification-token');
  },

  clearAttempts: async (email, type = 'register') => {
    const cleanEmail = normalizeEmail(email);
    try {
      await safeRedis(
        () => redis.del(getRequestAttemptsKey(type, cleanEmail)),
        'delete-request-attempts'
      );
      await safeRedis(
        () => redis.del(getVerifyAttemptsKey(type, cleanEmail)),
        'delete-verify-attempts'
      );
    } catch (error) {
      logger.warn(`OTP clearAttempts skipped for ${cleanEmail}: ${error.message}`);
    }
  },
};

module.exports = otpService;
