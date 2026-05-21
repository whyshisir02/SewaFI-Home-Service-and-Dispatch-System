const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/notifications/notification.controller');
const notificationServicePath = require.resolve('../src/services/notification.service');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const runHandler = async (handler, req) => {
  const res = createResponse();
  let nextError = null;

  await handler(req, res, (error) => {
    nextError = error;
  });

  return { res, nextError };
};

const loadNotificationController = (notificationOverrides = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[notificationServicePath];

  const notificationService = {
    getUserNotifications: async () => [],
    markAsRead: async () => ({}),
    markAllAsRead: async () => ({}),
    ...notificationOverrides,
  };

  require.cache[notificationServicePath] = {
    id: notificationServicePath,
    filename: notificationServicePath,
    loaded: true,
    exports: notificationService,
  };

  return require(controllerPath);
};

test('getMyNotifications returns the current user notifications', async () => {
  const controller = loadNotificationController({
    getUserNotifications: async (userId) => [
      { id: 'n1', userId, title: 'Hello' },
    ],
  });

  const { res, nextError } = await runHandler(controller.getMyNotifications, {
    user: { id: 'user-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data, [
    { id: 'n1', userId: 'user-1', title: 'Hello' },
  ]);
});

test('markAsRead sends the notification id and current user id to the service', async () => {
  const calls = [];
  const controller = loadNotificationController({
    markAsRead: async (notificationId, userId) => {
      calls.push({ notificationId, userId });
    },
  });

  const { res, nextError } = await runHandler(controller.markAsRead, {
    params: { id: 'notification-1' },
    user: { id: 'user-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls, [{
    notificationId: 'notification-1',
    userId: 'user-1',
  }]);
});

test('markAllAsRead marks all unread notifications for the current user', async () => {
  const calls = [];
  const controller = loadNotificationController({
    markAllAsRead: async (userId) => {
      calls.push(userId);
    },
  });

  const { res, nextError } = await runHandler(controller.markAllAsRead, {
    user: { id: 'user-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls, ['user-1']);
});
