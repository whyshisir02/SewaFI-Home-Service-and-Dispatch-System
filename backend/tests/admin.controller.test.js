const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/admin/admin.controller');
const databasePath = require.resolve('../src/config/database');
const notificationPath = require.resolve('../src/services/notification.service');
const socketPath = require.resolve('../src/config/socket');
const loggerPath = require.resolve('../src/config/logger');

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

const createPrismaMock = () => ({
  user: {
    findUnique: async () => null,
    findMany: async () => [],
    count: async () => 0,
    update: () => ({ type: 'user.update' }),
  },
  providerProfile: {
    update: () => ({ type: 'providerProfile.update' }),
    findUnique: async () => null,
  },
  service: {
    count: async () => 0,
  },
  serviceCategory: {
    count: async () => 0,
    findMany: async () => [],
  },
  booking: {
    count: async () => 0,
    aggregate: async () => ({ _sum: { totalPrice: 0 }, _count: 0 }),
    groupBy: async () => [],
    findMany: async () => [],
  },
  review: {
    count: async () => 0,
    aggregate: async () => ({ _avg: { rating: 0 } }),
    findMany: async () => [],
  },
  $transaction: async (operations) => operations,
});

const loadAdminController = ({
  prismaOverrides = {},
  notificationOverrides = {},
  socketOverrides = {},
  loggerOverrides = {},
} = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[databasePath];
  delete require.cache[notificationPath];
  delete require.cache[socketPath];
  delete require.cache[loggerPath];

  const prisma = createPrismaMock();
  Object.assign(prisma, prismaOverrides);

  const notificationService = {
    notifyProviderApproved: async () => {},
    notifyProviderRejected: async () => {},
    ...notificationOverrides,
  };

  const socket = {
    emitToPublic: () => {},
    ...socketOverrides,
  };

  const logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    ...loggerOverrides,
  };

  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: { prisma, connectDB: async () => {} },
  };
  require.cache[notificationPath] = {
    id: notificationPath,
    filename: notificationPath,
    loaded: true,
    exports: notificationService,
  };
  require.cache[socketPath] = {
    id: socketPath,
    filename: socketPath,
    loaded: true,
    exports: socket,
  };
  require.cache[loggerPath] = {
    id: loggerPath,
    filename: loggerPath,
    loaded: true,
    exports: logger,
  };

  return {
    controller: require(controllerPath),
  };
};

test('approveProvider activates the provider, notifies them, and broadcasts the approval', async () => {
  const transactions = [];
  const notificationCalls = [];
  const publicEmits = [];

  const { controller } = loadAdminController({
    prismaOverrides: {
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          name: 'Sita',
          email: 'sita@example.com',
          providerProfile: { status: 'PENDING_APPROVAL' },
        }),
        update: ({ where, data }) => ({ action: 'user.update', where, data }),
        findMany: async () => [],
        count: async () => 0,
      },
      providerProfile: {
        update: ({ where, data }) => ({ action: 'providerProfile.update', where, data }),
        findUnique: async () => null,
      },
      $transaction: async (operations) => {
        transactions.push(operations);
        return operations;
      },
    },
    notificationOverrides: {
      notifyProviderApproved: async (providerId) => {
        notificationCalls.push(providerId);
      },
    },
    socketOverrides: {
      emitToPublic: (...args) => {
        publicEmits.push(args);
      },
    },
  });

  const { res, nextError } = await runHandler(controller.approveProvider, {
    params: { id: 'provider-1' },
    user: { id: 'admin-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].length, 2);
  assert.deepEqual(notificationCalls, ['provider-1']);
  assert.deepEqual(publicEmits, [[
    'provider:approved',
    { providerId: 'provider-1', name: 'Sita' },
  ]]);
});

test('rejectProvider requires a reason before rejecting a provider', async () => {
  const { controller } = loadAdminController();

  const { nextError } = await runHandler(controller.rejectProvider, {
    params: { id: 'provider-1' },
    body: {},
    user: { id: 'admin-1' },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Rejection reason required');
});

test('getDashboardStats returns the normalized analytics payload', async () => {
  const { controller } = loadAdminController({
    prismaOverrides: {
      user: {
        count: async ({ where } = {}) => {
          if (!where) return 25;
          if (where.role === 'CUSTOMER') return 14;
          if (where.role === 'PROVIDER' && where.providerProfile?.status === 'APPROVED') return 8;
          if (where.role === 'PROVIDER' && where.providerProfile?.status === 'PENDING_APPROVAL') return 3;
          return 0;
        },
        findUnique: async () => null,
        findMany: async () => [],
        update: () => ({ action: 'user.update' }),
      },
      service: {
        count: async () => 11,
      },
      serviceCategory: {
        count: async () => 5,
        findMany: async () => [],
      },
      booking: {
        count: async ({ where } = {}) => {
          if (!where) return 120;
          if (where.status === 'PENDING') return 12;
          if (where.status === 'COMPLETED') return 90;
          if (where.status === 'CANCELLED') return 10;
          return 0;
        },
        aggregate: async ({ where } = {}) => {
          if (where?.completedAt?.gte && where?.completedAt?.lte) {
            return { _sum: { totalPrice: 15000 }, _count: 0 };
          }
          if (where?.completedAt?.gte) {
            return { _sum: { totalPrice: 20000 }, _count: 0 };
          }
          return { _sum: { totalPrice: 80000 }, _count: 0 };
        },
        groupBy: async () => [],
        findMany: async () => [],
      },
      review: {
        count: async () => 40,
        aggregate: async () => ({ _avg: { rating: 4.375 } }),
        findMany: async () => [],
      },
    },
  });

  const { res, nextError } = await runHandler(controller.getDashboardStats, {
    user: { id: 'admin-1', role: 'ADMIN' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.data.users, {
    total: 25,
    customers: 14,
    providers: 8,
    pendingProviders: 3,
  });
  assert.deepEqual(res.body.data.bookings, {
    total: 120,
    pending: 12,
    completed: 90,
    cancelled: 10,
  });
  assert.deepEqual(res.body.data.revenue, {
    total: 80000,
    thisMonth: 20000,
    lastMonth: 15000,
    growth: '33.33',
  });
  assert.deepEqual(res.body.data.reviews, {
    total: 40,
    averageRating: '4.38',
  });
});
