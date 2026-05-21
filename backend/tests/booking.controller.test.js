const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/bookings/booking.controller');
const databasePath = require.resolve('../src/config/database');
const notificationPath = require.resolve('../src/services/notification.service');
const emailPath = require.resolve('../src/services/email.service');
const socketPath = require.resolve('../src/config/socket');

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
  service: {
    findUnique: async () => null,
  },
  user: {
    findUnique: async () => null,
  },
  booking: {
    create: async () => {
      throw new Error('booking.create mock not configured');
    },
    findMany: async () => [],
    findUnique: async () => null,
  },
  providerProfile: {
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => ({}),
  },
  $transaction: async (callback) => callback({
    booking: {
      findUnique: async () => {
        throw new Error('transaction booking.findUnique mock not configured');
      },
      updateMany: async () => {
        throw new Error('transaction booking.updateMany mock not configured');
      },
    },
    providerProfile: {
      update: async () => ({}),
    },
  }),
});

const loadBookingController = ({
  prismaOverrides = {},
  notificationOverrides = {},
  emailOverrides = {},
  socketOverrides = {},
} = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[databasePath];
  delete require.cache[notificationPath];
  delete require.cache[emailPath];
  delete require.cache[socketPath];

  const prisma = createPrismaMock();
  Object.assign(prisma, prismaOverrides);

  const notificationService = {
    notifyNewJob: async () => ({}),
    notifyBookingAccepted: async () => ({}),
    notifyStatusUpdate: async () => ({}),
    ...notificationOverrides,
  };

  const emailService = {
    sendBookingConfirmation: async () => {},
    sendProviderAssigned: async () => {},
    ...emailOverrides,
  };

  const socket = {
    emitToRole: () => {},
    emitToUser: () => {},
    ...socketOverrides,
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
  require.cache[emailPath] = {
    id: emailPath,
    filename: emailPath,
    loaded: true,
    exports: emailService,
  };
  require.cache[socketPath] = {
    id: socketPath,
    filename: socketPath,
    loaded: true,
    exports: socket,
  };

  return {
    controller: require(controllerPath),
    prisma,
    notificationService,
    emailService,
    socket,
  };
};

test('createBooking rejects a selected provider outside the service category', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      service: {
        findUnique: async () => ({
          id: 'service-1',
          name: 'Deep Cleaning',
          basePrice: 2500,
          categoryId: 'cat-cleaning',
          category: { id: 'cat-cleaning', name: 'Cleaning' },
        }),
      },
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            status: 'APPROVED',
            categoryId: 'cat-plumbing',
            serviceAreas: [{ province: 'Bagmati', district: 'Kathmandu', municipality: null }],
          },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      providerId: 'provider-1',
      address: 'Kathmandu',
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      latitude: 27.7172,
      longitude: 85.324,
      scheduledTime: '2099-01-01T10:00:00.000Z',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Selected provider does not offer this category');
});

test('createBooking rejects a selected provider outside the booking area', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      service: {
        findUnique: async () => ({
          id: 'service-1',
          name: 'Deep Cleaning',
          basePrice: 2500,
          categoryId: 'cat-cleaning',
          category: { id: 'cat-cleaning', name: 'Cleaning' },
        }),
      },
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            status: 'APPROVED',
            categoryId: 'cat-cleaning',
            serviceAreas: [{ province: 'Bagmati', district: 'Lalitpur', municipality: null }],
          },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      providerId: 'provider-1',
      address: 'Kathmandu',
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
      latitude: 27.7172,
      longitude: 85.324,
      scheduledTime: '2099-01-01T10:00:00.000Z',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Selected provider does not serve this booking area');
});

test('createBooking requires current coordinates before creating a booking', async () => {
  const { controller } = loadBookingController();

  const { nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      address: 'Kathmandu',
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      scheduledTime: '2099-01-01T10:00:00.000Z',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Current location is required to create a booking');
});

test('createBooking only notifies the first dispatch wave immediately for open jobs', async () => {
  const notifyCalls = [];
  const userEmits = [];

  const { controller } = loadBookingController({
    prismaOverrides: {
      service: {
        findUnique: async () => ({
          id: 'service-1',
          name: 'Deep Cleaning',
          basePrice: 2500,
          categoryId: 'cat-cleaning',
          category: { id: 'cat-cleaning', name: 'Cleaning' },
        }),
      },
      booking: {
        create: async ({ data }) => ({
          id: 'booking-1',
          bookingCode: 'SWF-1002',
          ...data,
          service: { id: 'service-1', name: 'Deep Cleaning' },
          customer: { id: 'customer-1', email: 'customer@example.com' },
        }),
      },
      providerProfile: {
        findMany: async () => [
          {
            userId: 'provider-near',
            serviceAreas: [{ province: 'Bagmati', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan' }],
          },
          {
            userId: 'provider-district',
            serviceAreas: [{ province: 'Bagmati', district: 'Kathmandu', municipality: null }],
          },
        ],
      },
    },
    notificationOverrides: {
      notifyNewJob: async (...args) => {
        notifyCalls.push(args);
      },
    },
    socketOverrides: {
      emitToUser: (...args) => {
        userEmits.push(args);
      },
    },
  });

  const { res, nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      address: 'Kathmandu',
      province: 'Bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
      latitude: 27.7172,
      longitude: 85.324,
      scheduledTime: '2099-01-01T10:00:00.000Z',
    },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(notifyCalls, [[
    'provider-near',
    'Deep Cleaning',
    '2500',
    'booking-1',
    { dispatchPhase: 'LOCAL' },
  ]]);
  assert.deepEqual(userEmits, [[
    'provider-near',
    'job:new',
    {
      bookingId: 'booking-1',
      bookingCode: 'SWF-1002',
      serviceName: 'Deep Cleaning',
      categoryId: 'cat-cleaning',
      price: 2500,
      targeted: false,
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
      dispatchPhase: 'LOCAL',
    },
  ]]);
});

test('createBooking creates a targeted provider booking and emits only direct notifications', async () => {
  const notifyCalls = [];
  const emailCalls = [];
  const userEmits = [];
  const roleEmits = [];

  const createdBooking = {
    id: 'booking-1',
    bookingCode: 'SWF-1001',
    providerId: 'provider-1',
    customerId: 'customer-1',
    address: 'Lalitpur',
    scheduledTime: new Date('2099-01-01T10:00:00.000Z'),
    service: { id: 'service-1', name: 'Deep Cleaning' },
    customer: { id: 'customer-1', email: 'customer@example.com' },
  };

  const { controller } = loadBookingController({
    prismaOverrides: {
      service: {
        findUnique: async () => ({
          id: 'service-1',
          name: 'Deep Cleaning',
          basePrice: 2500,
          categoryId: 'cat-cleaning',
          category: { id: 'cat-cleaning', name: 'Cleaning' },
        }),
      },
      user: {
        findUnique: async () => ({
          id: 'provider-1',
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            status: 'APPROVED',
            categoryId: 'cat-cleaning',
            serviceAreas: [{ province: 'Bagmati', district: 'Lalitpur', municipality: null }],
          },
        }),
      },
      booking: {
        create: async ({ data }) => ({
          ...createdBooking,
          ...data,
          service: { id: 'service-1', name: 'Deep Cleaning' },
          customer: { id: 'customer-1', email: 'customer@example.com' },
        }),
      },
      providerProfile: {
        findMany: async () => {
          throw new Error('provider pool should not be queried for a direct booking');
        },
      },
    },
    notificationOverrides: {
      notifyNewJob: async (...args) => {
        notifyCalls.push(args);
      },
    },
    emailOverrides: {
      sendBookingConfirmation: async (...args) => {
        emailCalls.push(args);
      },
    },
    socketOverrides: {
      emitToUser: (...args) => {
        userEmits.push(args);
      },
      emitToRole: (...args) => {
        roleEmits.push(args);
      },
    },
  });

  const { res, nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      providerId: 'provider-1',
      address: 'Lalitpur',
      notes: 'Bring supplies',
      scheduledTime: '2099-01-01T10:00:00.000Z',
      latitude: 27.67,
      longitude: 85.32,
      province: 'Bagmati',
      district: 'Lalitpur',
      municipality: 'Mahalaxmi',
    },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.providerId, 'provider-1');
  assert.deepEqual(notifyCalls, [['provider-1', 'Deep Cleaning', '2500', 'booking-1', { dispatchPhase: 'DIRECT' }]]);
  assert.deepEqual(emailCalls, [[
    'customer@example.com',
    {
      bookingCode: 'SWF-1001',
      serviceName: 'Deep Cleaning',
      scheduledTime: createdBooking.scheduledTime,
      address: 'Lalitpur',
    },
  ]]);
  assert.deepEqual(userEmits, [[
    'provider-1',
    'job:new',
    {
      bookingId: 'booking-1',
      bookingCode: 'SWF-1001',
      serviceName: 'Deep Cleaning',
      categoryId: 'cat-cleaning',
      price: 2500,
      targeted: true,
      dispatchPhase: 'DIRECT',
    },
  ]]);
  assert.deepEqual(roleEmits, []);
});

test('createBooking rejects open bookings when no providers serve the booking area', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      service: {
        findUnique: async () => ({
          id: 'service-1',
          name: 'Deep Cleaning',
          basePrice: 2500,
          categoryId: 'cat-cleaning',
          category: { id: 'cat-cleaning', name: 'Cleaning' },
        }),
      },
      providerProfile: {
        findMany: async () => [],
      },
    },
  });

  const { nextError } = await runHandler(controller.createBooking, {
    user: { id: 'customer-1' },
    body: {
      serviceId: 'service-1',
      address: 'Pokhara',
      province: 'Gandaki',
      district: 'Kaski',
      municipality: 'Pokhara Metropolitan',
      latitude: 28.2096,
      longitude: 83.9856,
      scheduledTime: '2099-01-01T10:00:00.000Z',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'No providers currently serve this booking area');
});

test('acceptBooking blocks providers from accepting jobs targeted to someone else', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          userId: 'provider-1',
          status: 'APPROVED',
          isCurrentlyBusy: false,
          categoryId: 'cat-cleaning',
          serviceAreas: [{ province: 'Bagmati', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan' }],
        }),
      },
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          bookingCode: 'SWF-1001',
          status: 'PENDING',
          providerId: 'provider-2',
          customerId: 'customer-1',
          service: { id: 'service-1', categoryId: 'cat-cleaning' },
          customer: { id: 'customer-1', email: 'customer@example.com' },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.acceptBooking, {
    params: { id: 'booking-1' },
    user: {
      id: 'provider-1',
      name: 'Provider One',
      phone: '9800000000',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.message, 'This booking was requested from another provider');
});

test('acceptBooking allows same-area providers when dispatch has no separate log table', async () => {
  const txBooking = {
    id: 'booking-1',
    bookingCode: 'SWF-1003',
    status: 'ACCEPTED',
    providerId: 'provider-1',
    province: ' Bagmati ',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan',
    customerId: 'customer-1',
    service: { id: 'service-1', categoryId: 'cat-cleaning', subCategoryId: null },
    customer: { id: 'customer-1', email: 'customer@example.com' },
    provider: { id: 'provider-1', name: 'Provider One', phone: '9800000000', avatar: null },
  };

  const { controller } = loadBookingController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          id: 'profile-1',
          userId: 'provider-1',
          status: 'APPROVED',
          availability: 'Available',
          isCurrentlyBusy: false,
          categoryId: 'cat-cleaning',
          serviceAreas: [{ province: 'bagmati', district: ' kathmandu ', municipality: null }],
          subCategories: [],
          user: { isActive: true },
        }),
      },
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          bookingCode: 'SWF-1003',
          status: 'PENDING',
          providerId: null,
          province: 'Bagmati',
          district: 'Kathmandu',
          municipality: 'Kathmandu Metropolitan',
          createdAt: new Date(),
          customerId: 'customer-1',
          service: { id: 'service-1', categoryId: 'cat-cleaning', subCategoryId: null },
          customer: { id: 'customer-1', email: 'customer@example.com' },
        }),
      },
      $transaction: async (callback) => callback({
        booking: {
          findUnique: async ({ include }) => (include ? txBooking : {
            id: 'booking-1',
            status: 'PENDING',
            providerId: null,
          }),
          updateMany: async () => ({ count: 1 }),
        },
        providerProfile: {
          update: async () => ({}),
        },
      }),
    },
  });

  const { res, nextError } = await runHandler(controller.acceptBooking, {
    params: { id: 'booking-1' },
    user: {
      id: 'provider-1',
      name: 'Provider One',
      phone: '9800000000',
    },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.providerId, 'provider-1');
});

test('acceptBooking blocks providers outside the dispatch area fallback', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          id: 'profile-1',
          userId: 'provider-1',
          status: 'APPROVED',
          availability: 'Available',
          isCurrentlyBusy: false,
          categoryId: 'cat-cleaning',
          serviceAreas: [{ province: 'Bagmati', district: 'Lalitpur', municipality: null }],
          subCategories: [],
          user: { isActive: true },
        }),
      },
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          bookingCode: 'SWF-1003',
          status: 'PENDING',
          providerId: null,
          province: 'Bagmati',
          district: 'Kathmandu',
          municipality: 'Kathmandu Metropolitan',
          createdAt: new Date(),
          customerId: 'customer-1',
          service: { id: 'service-1', categoryId: 'cat-cleaning', subCategoryId: null },
          customer: { id: 'customer-1', email: 'customer@example.com' },
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.acceptBooking, {
    params: { id: 'booking-1' },
    user: {
      id: 'provider-1',
      name: 'Provider One',
      phone: '9800000000',
    },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.message, 'This booking is not available in your dispatch area yet');
});

test('getAvailableProviderBookings fetches both direct requests and unassigned category jobs', async () => {
  let whereClause = null;

  const { controller } = loadBookingController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          userId: 'provider-1',
          status: 'APPROVED',
          categoryId: 'cat-cleaning',
          serviceAreas: [{ province: 'Bagmati', district: 'Kathmandu', municipality: null }],
        }),
      },
      booking: {
        findMany: async ({ where }) => {
          whereClause = where;
          return [
            {
              id: 'direct-job',
              providerId: 'provider-1',
              createdAt: new Date(),
              service: { category: true, subCategory: true },
            },
            {
              id: 'local-job',
              providerId: null,
              province: 'Bagmati',
              district: 'Kathmandu',
              municipality: 'Kathmandu Metropolitan',
              createdAt: new Date(Date.now() - 5 * 60 * 1000),
              service: { category: true, subCategory: true },
              customer: { id: 'customer-1', name: 'Asha' },
            },
          ];
        },
      },
    },
  });

  const { res, nextError } = await runHandler(controller.getAvailableProviderBookings, {
    user: { id: 'provider-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(whereClause, {
    status: 'PENDING',
    OR: [
      { providerId: 'provider-1' },
      {
        providerId: null,
        service: {
          categoryId: 'cat-cleaning',
        },
      },
    ],
  });
  assert.deepEqual(res.body.data.map((item) => ({ id: item.id, dispatchPhase: item.dispatchPhase })), [
    { id: 'direct-job', dispatchPhase: 'DIRECT' },
    { id: 'local-job', dispatchPhase: 'EXPANDED' },
  ]);
  assert.equal(res.body.data[1].address, null);
  assert.equal(res.body.data[1].customer.phone, null);
  assert.equal(res.body.data[1].locationVisibility, 'AREA_ONLY');
});

test('listBookings masks exact customer location for providers before acceptance', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      providerProfile: {
        findUnique: async () => ({
          userId: 'provider-1',
          categoryId: 'cat-cleaning',
        }),
      },
      booking: {
        findMany: async () => [
          {
            id: 'booking-1',
            status: 'PENDING',
            providerId: null,
            province: 'Bagmati',
            district: 'Kathmandu',
            municipality: 'Kathmandu Metropolitan',
            address: 'Baneshwor-10, near chowk',
            latitude: 27.71,
            longitude: 85.33,
            notes: 'Call on arrival',
            createdAt: new Date(),
            service: { category: true, subCategory: true },
            customer: { id: 'customer-1', name: 'Asha', phone: '9800000000', avatar: null },
            provider: null,
            review: null,
          },
        ],
      },
    },
  });

  const { res, nextError } = await runHandler(controller.listBookings, {
    user: { id: 'provider-1', role: 'PROVIDER' },
    query: {},
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data[0].address, null);
  assert.equal(res.body.data[0].latitude, null);
  assert.equal(res.body.data[0].longitude, null);
  assert.equal(res.body.data[0].notes, null);
  assert.equal(res.body.data[0].customer.phone, null);
  assert.equal(res.body.data[0].locationVisibility, 'AREA_ONLY');
});

test('getBooking keeps exact location for the assigned provider after acceptance', async () => {
  const { controller } = loadBookingController({
    prismaOverrides: {
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          status: 'ACCEPTED',
          providerId: 'provider-1',
          province: 'Bagmati',
          district: 'Kathmandu',
          municipality: 'Kathmandu Metropolitan',
          address: 'Baneshwor-10, near chowk',
          latitude: 27.71,
          longitude: 85.33,
          notes: 'Call on arrival',
          service: { category: true, subCategory: true },
          customer: { id: 'customer-1', name: 'Asha', phone: '9800000000', email: 'asha@example.com', avatar: null },
          provider: { id: 'provider-1', name: 'Sita', phone: '9811111111', avatar: null, providerProfile: { averageRating: 4.8, totalJobs: 20 } },
          review: null,
        }),
      },
    },
  });

  const { res, nextError } = await runHandler(controller.getBooking, {
    user: { id: 'provider-1', role: 'PROVIDER' },
    params: { id: 'booking-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.address, 'Baneshwor-10, near chowk');
  assert.equal(res.body.data.customer.phone, '9800000000');
  assert.equal(res.body.data.locationVisibility, 'PRECISE');
});
