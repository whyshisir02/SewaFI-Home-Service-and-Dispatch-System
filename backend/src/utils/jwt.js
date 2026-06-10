const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });

const signRefreshToken = (payload, expiresIn = env.JWT_REFRESH_EXPIRY) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
