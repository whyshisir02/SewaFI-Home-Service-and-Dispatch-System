require('dotenv').config();
const Joi = require('joi');

console.log('✅ Loaded Resend-only env.js');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(5000),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional().allow('', null),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  // Support both old and new names
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().optional().allow('', null),
  JWT_REFRESH_EXPIRES_IN: Joi.string().optional().allow('', null),

  // CORS / Frontend
  CORS_ORIGIN: Joi.string().default('https://sewa-fi.vercel.app,http://localhost:5173'),
  CLIENT_URL: Joi.string().optional().allow('', null),
  FRONTEND_URL: Joi.string().optional().allow('', null),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow('', null),
  CLOUDINARY_API_KEY: Joi.string().optional().allow('', null),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow('', null),

  // Resend Email
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM_NAME: Joi.string().default('SewaFi'),
  EMAIL_FROM_ADDRESS: Joi.string().email().default('onboarding@resend.dev'),

  // OTP
  OTP_EXPIRY_MINUTES: Joi.number().default(5),
  OTP_MAX_ATTEMPTS: Joi.number().default(5),

  // Redis
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  DISPATCH_ESCALATION_MS: Joi.number().min(1000).default(120000),

  PLATFORM_COMMISSION_PERCENT: Joi.number().min(0).max(100).default(10),

  WEB_PUSH_PUBLIC_KEY: Joi.string().optional().allow('', null),
  WEB_PUSH_PRIVATE_KEY: Joi.string().optional().allow('', null),
  WEB_PUSH_SUBJECT: Joi.string().optional().allow('', null),

  // File upload
  MAX_FILE_SIZE: Joi.number().default(5242880),
  ALLOWED_EXTENSIONS: Joi.string().default('jpg,jpeg,png,webp'),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`❌ Config validation error: ${error.message}`);
}

const corsOrigin = envVars.CLIENT_URL || envVars.CORS_ORIGIN;

const frontendUrl =
  envVars.FRONTEND_URL ||
  corsOrigin.split(',')[0].trim();

module.exports = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  LOG_LEVEL: envVars.LOG_LEVEL,

  DATABASE_URL: envVars.DATABASE_URL,
  DIRECT_URL: envVars.DIRECT_URL,

  JWT_ACCESS_SECRET: envVars.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: envVars.JWT_ACCESS_EXPIRES_IN || envVars.JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY: envVars.JWT_REFRESH_EXPIRES_IN || envVars.JWT_REFRESH_EXPIRY,

  CORS_ORIGIN: envVars.CORS_ORIGIN,
  CLIENT_URL: corsOrigin,
  FRONTEND_URL: frontendUrl,

  CLOUDINARY: {
    CLOUD_NAME: envVars.CLOUDINARY_CLOUD_NAME,
    API_KEY: envVars.CLOUDINARY_API_KEY,
    API_SECRET: envVars.CLOUDINARY_API_SECRET,
  },

  RESEND: {
    API_KEY: envVars.RESEND_API_KEY,
  },

  EMAIL: {
    FROM_NAME: envVars.EMAIL_FROM_NAME,
    FROM_ADDRESS: envVars.EMAIL_FROM_ADDRESS,
  },

  OTP: {
    EXPIRY_MINUTES: envVars.OTP_EXPIRY_MINUTES,
    MAX_ATTEMPTS: envVars.OTP_MAX_ATTEMPTS,
  },

  REDIS_URL: envVars.REDIS_URL,
  DISPATCH_ESCALATION_MS: envVars.DISPATCH_ESCALATION_MS,
  PLATFORM_COMMISSION_PERCENT: envVars.PLATFORM_COMMISSION_PERCENT,
  WEB_PUSH_PUBLIC_KEY: envVars.WEB_PUSH_PUBLIC_KEY,
  WEB_PUSH_PRIVATE_KEY: envVars.WEB_PUSH_PRIVATE_KEY,
  WEB_PUSH_SUBJECT: envVars.WEB_PUSH_SUBJECT,

  FILE: {
    MAX_SIZE: envVars.MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS: envVars.ALLOWED_EXTENSIONS
      .split(',')
      .map((ext) => ext.trim())
      .filter(Boolean),
  },
};
