const env = require('./env');

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...parseOrigins(env.CLIENT_URL),
    ...parseOrigins(env.CORS_ORIGIN),
    ...parseOrigins(env.FRONTEND_URL),
  ]),
];

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

module.exports = { allowedOrigins, corsOrigin };
