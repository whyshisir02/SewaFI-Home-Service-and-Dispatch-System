const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../src/modules/reviews/review.controller');
const databasePath = require.resolve('../src/config/database');
const fileServicePath = require.resolve('../src/services/file.service');
const notificationPath = require.resolve('../src/services/notification.service');
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
  booking: {
    findUnique: async () => null,
  },
  review: {
    findMany: async () => [],
  },
  providerProfile: {
    update: async () => ({}),
  },
  $transaction: async (callback) => callback({
    review: {
      create: async () => {
        throw new Error('review.create mock not configured');
      },
      findMany: async () => [],
    },
    providerProfile: {
      update: async () => ({}),
    },
  }),
});

const loadReviewController = ({
  prismaOverrides = {},
  fileServiceOverrides = {},
  notificationOverrides = {},
  loggerOverrides = {},
} = {}) => {
  delete require.cache[controllerPath];
  delete require.cache[databasePath];
  delete require.cache[fileServicePath];
  delete require.cache[notificationPath];
  delete require.cache[loggerPath];

  const prisma = createPrismaMock();
  Object.assign(prisma, prismaOverrides);

  const fileService = {
    fileService: {
      uploadToCloudinary: async () => ({
        secure_url: 'https://cdn.example.com/review.jpg',
        public_id: 'reviews/photo',
      }),
      ...fileServiceOverrides,
    },
  };

  const notificationService = {
    notifyReviewReceived: async () => ({}),
    ...notificationOverrides,
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
  require.cache[notificationPath] = {
    id: notificationPath,
    filename: notificationPath,
    loaded: true,
    exports: notificationService,
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

test('createReview rejects ratings outside the supported range', async () => {
  const { controller } = loadReviewController();

  const { nextError } = await runHandler(controller.createReview, {
    body: {
      bookingId: 'booking-1',
      rating: '5.5',
      comment: 'Too high',
    },
    user: { id: 'customer-1' },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.message, 'Rating must be between 0.5 and 5');
});

test('createReview requires a completed booking owned by the customer', async () => {
  const { controller } = loadReviewController({
    prismaOverrides: {
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          customerId: 'customer-2',
          status: 'COMPLETED',
          review: null,
        }),
      },
    },
  });

  const { nextError } = await runHandler(controller.createReview, {
    body: {
      bookingId: 'booking-1',
      rating: '4.5',
      comment: 'Nice work',
    },
    user: { id: 'customer-1' },
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.message, 'Not your booking');
});

test('createReview creates the review, updates provider stats, and notifies the provider', async () => {
  const uploads = [];
  const notifications = [];
  const providerUpdates = [];
  const reviewCreates = [];

  const { controller } = loadReviewController({
    prismaOverrides: {
      booking: {
        findUnique: async () => ({
          id: 'booking-1',
          bookingCode: 'SWF-2001',
          customerId: 'customer-1',
          providerId: 'provider-1',
          status: 'COMPLETED',
          review: null,
          customer: { name: 'Asha' },
        }),
      },
      $transaction: async (callback) => callback({
        review: {
          create: async ({ data }) => {
            reviewCreates.push(data);
            return {
              id: 'review-1',
              ...data,
            };
          },
          findMany: async () => [{ rating: 4 }, { rating: 5 }],
        },
        providerProfile: {
          update: async ({ where, data }) => {
            providerUpdates.push({ where, data });
            return {};
          },
        },
      }),
    },
    fileServiceOverrides: {
      uploadToCloudinary: async (file, folder) => {
        uploads.push({ name: file.originalname, folder });
        return {
          secure_url: `https://cdn.example.com/${file.originalname}`,
          public_id: `reviews/${file.originalname}`,
        };
      },
    },
    notificationOverrides: {
      notifyReviewReceived: async (...args) => {
        notifications.push(args);
      },
    },
  });

  const { res, nextError } = await runHandler(controller.createReview, {
    body: {
      bookingId: 'booking-1',
      rating: '5',
      comment: 'Excellent',
    },
    files: [
      { originalname: 'photo-1.jpg' },
      { originalname: 'photo-2.jpg' },
    ],
    user: { id: 'customer-1' },
  });

  assert.equal(nextError, null);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.deepEqual(uploads, [
    { name: 'photo-1.jpg', folder: 'reviews/booking-1' },
    { name: 'photo-2.jpg', folder: 'reviews/booking-1' },
  ]);
  assert.equal(reviewCreates.length, 1);
  assert.deepEqual(reviewCreates[0], {
    bookingId: 'booking-1',
    authorId: 'customer-1',
    rating: 5,
    comment: 'Excellent',
    photos: [
      'https://cdn.example.com/photo-1.jpg',
      'https://cdn.example.com/photo-2.jpg',
    ],
    photoPublicIds: [
      'reviews/photo-1.jpg',
      'reviews/photo-2.jpg',
    ],
  });
  assert.deepEqual(providerUpdates, [{
    where: { userId: 'provider-1' },
    data: {
      averageRating: 4.5,
      totalReviews: 2,
    },
  }]);
  assert.deepEqual(notifications, [[
    'provider-1',
    'Asha',
    5,
    'SWF-2001',
  ]]);
});
