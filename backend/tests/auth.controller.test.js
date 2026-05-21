const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/auth/auth.controller');
const databasePath = require.resolve('../src/config/database');
const otpPath = require.resolve('../src/services/otp.service');
const emailPath = require.resolve('../src/services/email.service');
const fileServicePath = require.resolve('../src/services/file.service');
const socketPath = require.resolve('../src/config/socket');
const loggerPath = require.resolve('../src/config/logger');
const jwtPath = require.resolve('../src/utils/jwt');
const bcryptPath = require.resolve('bcryptjs');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  cookies: [],
  clearedCookies: [],
  status(code) {
    this.statusCode = code;
    return this;
  },
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
    return this;
  },
  clearCookie(name) {
    this.clearedCookies.push(name);
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
    findFirst: async () => null,
    create: async () => {
      throw new Error('user.create mock not configured');
    },
    update: async () => {
      throw new Error('user.update mock not configured');
    },
  },
  refreshToken: {
    create: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
  },
  serviceCategory: {
    findUnique: async () => null,
  },
  $transaction: async (callback) => callback({
    user: { create: async () => ({}) },
    providerProfile: { create: async () => ({}) },
  }),
});

const loadAuthController = ({
  prismaOverrides = {},
  otpOverrides = {},
  emailOverrides = {},
  fileServiceOverrides = {},
  socketOverrides = {},
  loggerOverrides = {},
  jwtOverrides = {},
  bcryptOverrides = {},
} = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[databasePath];
  delete require.cache[otpPath];
  delete require.cache[emailPath];
  delete require.cache[fileServicePath];
  delete require.cache[socketPath];
  delete require.cache[loggerPath];
  delete require.cache[jwtPath];
  delete require.cache[bcryptPath];

  const prisma = createPrismaMock();
  Object.assign(prisma, prismaOverrides);

  const otpService = {
    sendOTP: async () => '123456',
    verifyOTP: async () => true,
    createVerificationToken: async () => 'verification-token',
    verifyToken: async () => true,
    deleteVerificationToken: async () => {},
    ...otpOverrides,
  };

  const emailService = {
    sendOTPEmail: async () => true,
    sendPasswordResetOTP: async () => true,
    ...emailOverrides,
  };

  const fileService = {
    fileService: {
      uploadToCloudinary: async () => ({
        secure_url: 'https://cdn.example.com/file.jpg',
        public_id: 'kyc/file',
      }),
      ...fileServiceOverrides,
    },
    upload: { fields: () => {} },
  };

  const socket = {
    emitToRole: () => {},
    ...socketOverrides,
  };

  const logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    ...loggerOverrides,
  };

  const jwt = {
    signAccessToken: () => 'access-token',
    signRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ id: 'user-1', role: 'CUSTOMER' }),
    ...jwtOverrides,
  };

  const bcrypt = {
    hash: async () => 'hashed-password',
    compare: async () => true,
    ...bcryptOverrides,
  };

  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: { prisma, connectDB: async () => {} },
  };
  require.cache[otpPath] = {
    id: otpPath,
    filename: otpPath,
    loaded: true,
    exports: otpService,
  };
  require.cache[emailPath] = {
    id: emailPath,
    filename: emailPath,
    loaded: true,
    exports: emailService,
  };
  require.cache[fileServicePath] = {
    id: fileServicePath,
    filename: fileServicePath,
    loaded: true,
    exports: fileService,
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
  require.cache[jwtPath] = {
    id: jwtPath,
    filename: jwtPath,
    loaded: true,
    exports: jwt,
  };
  require.cache[bcryptPath] = {
    id: bcryptPath,
    filename: bcryptPath,
    loaded: true,
    exports: bcrypt,
  };

  return {
    controller: require(controllerPath),
    prisma,
  };
};

test('login blocks providers whose application is still pending approval', async () => {
  const { controller } = loadAuthController({
    prismaOverrides: {
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          email: 'provider@example.com',
          password: 'stored-hash',
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            status: 'PENDING_APPROVAL',
          },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.login, {
    body: { email: 'provider@example.com', password: 'secret' },
    ip: '127.0.0.1',
    cookies: {},
    headers: {},
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.message, 'Your application is under review');
});

test('login blocks rejected providers with the rejection reason', async () => {
  const { controller } = loadAuthController({
    prismaOverrides: {
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          email: 'provider@example.com',
          password: 'stored-hash',
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            status: 'REJECTED',
            rejectionReason: 'Incomplete KYC',
          },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.login, {
    body: { email: 'provider@example.com', password: 'secret' },
    ip: '127.0.0.1',
    cookies: {},
    headers: {},
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.message, 'Rejected: Incomplete KYC');
});

test('login issues cookies and tokens for an active customer', async () => {
  const refreshCreates = [];

  const { controller } = loadAuthController({
    prismaOverrides: {
      user: {
        findUnique: async () => ({
          id: 'customer-1',
          name: 'Asha',
          email: 'asha@example.com',
          password: 'stored-hash',
          role: 'CUSTOMER',
          isActive: true,
          providerProfile: null,
        }),
      },
      refreshToken: {
        create: async ({ data }) => {
          refreshCreates.push(data);
          return data;
        },
        deleteMany: async () => ({ count: 0 }),
      },
    },
    jwtOverrides: {
      signAccessToken: (payload) => `access-${payload.id}`,
      signRefreshToken: (payload) => `refresh-${payload.id}`,
    },
  });

  const { res, nextError } = await runHandler(controller.login, {
    body: { email: 'asha@example.com', password: 'secret' },
    ip: '127.0.0.1',
    cookies: {},
    headers: {},
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.accessToken, 'access-customer-1');
  assert.equal(res.body.data.refreshToken, 'refresh-customer-1');
  assert.equal(res.body.data.user.password, undefined);
  assert.equal(res.cookies.length, 2);
  assert.deepEqual(refreshCreates.map((item) => ({
    token: item.token,
    userId: item.userId,
  })), [{
    token: 'refresh-customer-1',
    userId: 'customer-1',
  }]);
});

test('registerCustomer creates a verified customer and clears the verification token', async () => {
  const verifyCalls = [];
  const deleteCalls = [];
  const createdUsers = [];

  const { controller } = loadAuthController({
    prismaOverrides: {
      user: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdUsers.push(data);
          return {
            id: 'customer-1',
            name: data.name,
            email: data.email,
            role: data.role,
          };
        },
      },
    },
    otpOverrides: {
      verifyToken: async (email, token) => {
        verifyCalls.push({ email, token });
      },
      deleteVerificationToken: async (email) => {
        deleteCalls.push(email);
      },
    },
    bcryptOverrides: {
      hash: async (password) => `hashed:${password}`,
    },
  });

  const { res, nextError } = await runHandler(controller.registerCustomer, {
    body: {
      verificationToken: 'verified-token',
      email: 'asha@example.com',
      name: 'Asha',
      phone: '9800000000',
      password: 'secret123',
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      ward: '1',
      streetAddress: 'Baneshwor',
    },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.deepEqual(verifyCalls, [{ email: 'asha@example.com', token: 'verified-token' }]);
  assert.deepEqual(deleteCalls, ['asha@example.com']);
  assert.equal(createdUsers.length, 1);
  assert.equal(createdUsers[0].password, 'hashed:secret123');
  assert.equal(createdUsers[0].role, 'CUSTOMER');
  assert.equal(createdUsers[0].isEmailVerified, true);
});
