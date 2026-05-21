const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');

const setTestEnv = () => {
  const defaults = {
    NODE_ENV: 'test',
    PORT: '5000',
    LOG_LEVEL: 'error',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/sewafi_test',
    JWT_ACCESS_SECRET: '12345678901234567890123456789012',
    JWT_REFRESH_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
    CORS_ORIGIN: 'http://localhost:5173',
    FRONTEND_URL: 'http://localhost:5173',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    EMAIL_SERVICE: 'gmail',
    EMAIL_USER: 'test@example.com',
    EMAIL_PASSWORD: 'test-password',
    EMAIL_FROM: 'noreply@sewafi.test',
    REDIS_URL: 'redis://localhost:6379',
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

setTestEnv();

const appPath = require.resolve('../src/app');
const routeModulePaths = [
  '../src/modules/auth/auth.routes',
  '../src/modules/users/user.routes',
  '../src/modules/services/service.routes',
  '../src/modules/subcategories/subcategory.routes',
  '../src/modules/bookings/booking.routes',
  '../src/modules/reviews/review.routes',
  '../src/modules/notifications/notification.routes',
  '../src/modules/admin/admin.routes',
  '../src/modules/locations/location.routes',
].map((modulePath) => require.resolve(modulePath));

for (const modulePath of routeModulePaths) {
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: express.Router(),
  };
}

delete require.cache[appPath];
const app = require('../src/app');

const startTestServer = async () => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    close: () => new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    }),
  };
};

test('GET /health returns API status payload', async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'OK');
    assert.equal(body.service, 'SewaFi API');
    assert.equal(typeof body.uptime, 'number');
  } finally {
    await server.close();
  }
});

test('unknown routes return the JSON 404 handler', async () => {
  const server = await startTestServer();

  try {
    const response = await fetch(`${server.baseUrl}/definitely-not-a-route`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.match(body.message, /definitely-not-a-route/);
  } finally {
    await server.close();
  }
});
