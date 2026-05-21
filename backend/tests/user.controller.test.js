const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/users/user.controller');
const databasePath = require.resolve('../src/config/database');
const fileServicePath = require.resolve('../src/services/file.service');
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
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => {
      throw new Error('user.update mock not configured');
    },
  },
  providerProfile: {
    update: async () => {
      throw new Error('providerProfile.update mock not configured');
    },
    findUnique: async () => null,
  },
  providerSubCategory: {
    deleteMany: async () => ({}),
    createMany: async () => ({}),
  },
  providerArea: {
    deleteMany: async () => ({}),
    createMany: async () => ({}),
  },
  providerService: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {
      throw new Error('providerService.create mock not configured');
    },
    delete: async () => ({}),
  },
  service: {
    findUnique: async () => null,
  },
});

const loadUserController = ({
  prismaOverrides = {},
  fileServiceOverrides = {},
  loggerOverrides = {},
} = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[databasePath];
  delete require.cache[fileServicePath];
  delete require.cache[loggerPath];

  const prisma = createPrismaMock();
  Object.entries(prismaOverrides).forEach(([model, overrides]) => {
    prisma[model] = {
      ...(prisma[model] || {}),
      ...overrides,
    };
  });

  const fileService = {
    fileService: {
      deleteFromCloudinary: async () => {},
      uploadProfileImage: async () => ({
        url: 'https://cdn.example.com/avatar.jpg',
        publicId: 'avatars/user-1',
      }),
      ...fileServiceOverrides,
    },
    upload: {
      single: () => {},
      fields: () => {},
    },
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
  require.cache[fileServicePath] = {
    id: fileServicePath,
    filename: fileServicePath,
    loaded: true,
    exports: fileService,
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

test('updateMyProfile updates only the provided profile fields', async () => {
  const updates = [];
  const { controller } = loadUserController({
    prismaOverrides: {
      user: {
        update: async ({ where, data }) => {
          updates.push({ where, data });
          return {
            id: where.id,
            ...data,
          };
        },
      },
    },
  });

  const { res, nextError } = await runHandler(controller.updateMyProfile, {
    user: { id: 'user-1' },
    body: {
      name: 'Updated Name',
      municipality: 'Kathmandu',
      tempStreetAddress: 'New temporary address',
    },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(updates, [{
    where: { id: 'user-1' },
    data: {
      name: 'Updated Name',
      municipality: 'Kathmandu',
      tempStreetAddress: 'New temporary address',
    },
  }]);
});

test('updateProviderAvailability normalizes string booleans into stored JSON', async () => {
  const updates = [];
  const { controller } = loadUserController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({ availability: null }),
        update: async ({ where, data, select }) => {
          updates.push({ where, data, select });
          return {
            userId: where.userId,
            availability: data.availability,
            isCurrentlyBusy: false,
          };
        },
      },
    },
  });

  const { res, nextError } = await runHandler(controller.updateProviderAvailability, {
    user: { id: 'provider-1' },
    body: { available: 'true' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.availability, JSON.stringify({ availableToday: true }));
  assert.deepEqual(updates[0].where, { userId: 'provider-1' });
});

test('getMyProfile parses provider availability JSON before returning it', async () => {
  const { controller } = loadUserController({
    prismaOverrides: {
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          name: 'Sita',
          providerProfile: {
            availability: '{"availableToday":true,"from":"08:00","to":"18:00"}',
          },
        }),
      },
    },
  });

  const { res, nextError } = await runHandler(controller.getMyProfile, {
    user: { id: 'provider-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data.providerProfile.availability, {
    availableToday: true,
    from: '08:00',
    to: '18:00',
  });
});

test('addProviderService rejects services outside the provider category', async () => {
  const { controller } = loadUserController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          id: 'profile-1',
          categoryId: 'cat-cleaning',
          status: 'APPROVED',
        }),
      },
      service: {
        findUnique: async () => ({
          id: 'service-1',
          categoryId: 'cat-plumbing',
          isActive: true,
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.addProviderService, {
    user: { id: 'provider-1' },
    body: { serviceId: 'service-1', customPrice: '3000' },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Service category does not match provider category');
});

test('addProviderService creates a provider service with parsed custom pricing', async () => {
  const creates = [];
  const { controller } = loadUserController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          id: 'profile-1',
          categoryId: 'cat-cleaning',
          status: 'APPROVED',
        }),
      },
      service: {
        findUnique: async () => ({
          id: 'service-1',
          categoryId: 'cat-cleaning',
          isActive: true,
        }),
      },
      providerService: {
        findUnique: async () => null,
        create: async ({ data }) => {
          creates.push(data);
          return {
            id: 'provider-service-1',
            ...data,
          };
        },
      },
    },
  });

  const { res, nextError } = await runHandler(controller.addProviderService, {
    user: { id: 'provider-1' },
    body: { serviceId: 'service-1', customPrice: '3000.50' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(creates, [{
    providerId: 'profile-1',
    serviceId: 'service-1',
    customPrice: 3000.5,
  }]);
});

test('removeProviderService deletes an existing provider service mapping', async () => {
  const deletes = [];
  const { controller } = loadUserController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          id: 'profile-1',
        }),
      },
      providerService: {
        findUnique: async () => ({
          providerId: 'profile-1',
          serviceId: 'service-1',
        }),
        delete: async ({ where }) => {
          deletes.push(where);
          return {};
        },
      },
    },
  });

  const { res, nextError } = await runHandler(controller.removeProviderService, {
    user: { id: 'provider-1' },
    params: { serviceId: 'service-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(deletes, [{
    providerId_serviceId: {
      providerId: 'profile-1',
      serviceId: 'service-1',
    },
  }]);
});
