const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const notificationService = require('../../services/notification.service');
const logger = require('../../config/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STATUSES = new Set(['OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const MAX_LENGTH = {
  fullName: 120,
  email: 255,
  phone: 30,
  topic: 80,
  subject: 180,
  message: 2000,
};

const normalizeValue = (value) => String(value || '').trim();

const normalizeTopic = (value) =>
  normalizeValue(value)
    .replace(/\s+/g, '_')
    .toUpperCase();

const normalizeStatus = (value) =>
  normalizeValue(value)
    .replace(/\s+/g, '_')
    .toUpperCase();

const ensureMaxLength = (value, maxLength, fieldLabel) => {
  if (value && value.length > maxLength) {
    throw new ApiError(400, `${fieldLabel} must be ${maxLength} characters or fewer.`);
  }
};

const parseRangeFilter = (range) => {
  const key = normalizeValue(range).toLowerCase();
  if (!key || key === 'all_time') {
    return null;
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (key === 'today') {
    return { gte: start };
  }

  if (key === 'this_week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    return { gte: start };
  }

  if (key === 'this_month') {
    start.setDate(1);
    return { gte: start };
  }

  return null;
};

const toPublicPayload = (message) => ({
  id: message.id,
  ticketCode: message.ticketCode,
  fullName: message.fullName,
  email: message.email,
  phone: message.phone,
  topic: message.topic,
  subject: message.subject,
  message: message.message,
  status: message.status,
  createdAt: message.createdAt,
});

const runInBackground = (task, context) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      logger.warn(`[support] ${context}: ${error?.message || error}`);
    });
};

const createPublicContactMessage = asyncHandler(async (req, res) => {
  const fullName = normalizeValue(req.body.fullName || req.body.name);
  const email = normalizeValue(req.body.email).toLowerCase();
  const phone = normalizeValue(req.body.phone);
  const topic = normalizeTopic(req.body.topic);
  const subject = normalizeValue(req.body.subject);
  const message = normalizeValue(req.body.message);

  if (!fullName) {
    throw new ApiError(400, 'Full name is required.');
  }

  if (!email) {
    throw new ApiError(400, 'Email is required.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }

  if (!subject) {
    throw new ApiError(400, 'Subject is required.');
  }

  if (!message) {
    throw new ApiError(400, 'Message is required.');
  }

  ensureMaxLength(fullName, MAX_LENGTH.fullName, 'Full name');
  ensureMaxLength(email, MAX_LENGTH.email, 'Email');
  ensureMaxLength(phone, MAX_LENGTH.phone, 'Phone number');
  ensureMaxLength(topic, MAX_LENGTH.topic, 'Topic');
  ensureMaxLength(subject, MAX_LENGTH.subject, 'Subject');
  ensureMaxLength(message, MAX_LENGTH.message, 'Message');

  const supportMessage = await prisma.supportMessage.create({
    data: {
      fullName,
      email,
      phone: phone || null,
      topic: topic || null,
      subject,
      message,
      status: 'OPEN',
    },
  });

  runInBackground(
    () =>
      notificationService.notifyAdminNewSupportMessage(
        supportMessage.ticketCode,
        supportMessage.subject
      ),
    `admin support notification failed for ticket ${supportMessage.ticketCode}`
  );

  res.status(201).json(
    new ApiResponse(201, toPublicPayload(supportMessage), 'Support message submitted successfully.')
  );
});

const listAdminSupportMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const search = normalizeValue(req.query.search);
  const status = normalizeStatus(req.query.status);
  const topic = normalizeTopic(req.query.topic);
  const range = parseRangeFilter(req.query.range);
  const sort = normalizeValue(req.query.sort).toLowerCase() || 'newest';

  const where = {
    ...(status && status !== 'ALL' && ALLOWED_STATUSES.has(status) ? { status } : {}),
    ...(topic && topic !== 'ALL' ? { topic } : {}),
    ...(range ? { createdAt: range } : {}),
    ...(search
      ? {
          OR: [
            { ticketCode: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === 'oldest'
      ? [{ createdAt: 'asc' }]
      : sort === 'status'
        ? [{ status: 'asc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

  const [messages, total] = await Promise.all([
    prisma.supportMessage.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    prisma.supportMessage.count({ where }),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        messages,
        pagination: buildPaginationMeta({ page, limit, total }),
      },
      'Support messages fetched'
    )
  );
});

const getAdminSupportMessageById = asyncHandler(async (req, res) => {
  const message = await prisma.supportMessage.findUnique({
    where: { id: req.params.id },
  });

  if (!message) {
    throw new ApiError(404, 'Support message not found.');
  }

  res.json(new ApiResponse(200, message, 'Support message fetched'));
});

const getAdminSupportStats = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, open, inProgress, resolved, today] = await Promise.all([
    prisma.supportMessage.count(),
    prisma.supportMessage.count({ where: { status: 'OPEN' } }),
    prisma.supportMessage.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportMessage.count({ where: { status: 'RESOLVED' } }),
    prisma.supportMessage.count({ where: { createdAt: { gte: startOfDay } } }),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        total,
        open,
        inProgress,
        resolved,
        urgent: 0,
        today,
      },
      'Support stats fetched'
    )
  );
});

const updateAdminSupportStatus = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const status = normalizeStatus(req.body.status);

  if (!status || !ALLOWED_STATUSES.has(status)) {
    throw new ApiError(400, 'Invalid support status.');
  }

  const existing = await prisma.supportMessage.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, 'Support message not found.');
  }

  if (existing.status === status) {
    return res.json(new ApiResponse(200, existing, 'Support status already updated.'));
  }

  const now = new Date();
  const isResolvedLike = status === 'RESOLVED' || status === 'CLOSED';

  const updated = await prisma.supportMessage.update({
    where: { id },
    data: {
      status,
      resolvedAt: isResolvedLike ? existing.resolvedAt || now : null,
      resolvedById: isResolvedLike ? existing.resolvedById || req.user.id : null,
    },
  });

  res.json(new ApiResponse(200, updated, 'Support status updated successfully.'));
});

const resolveAdminSupportMessage = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existing = await prisma.supportMessage.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, 'Support message not found.');
  }

  if (existing.status === 'RESOLVED') {
    return res.json(new ApiResponse(200, existing, 'Support message already resolved.'));
  }

  const updated = await prisma.supportMessage.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolvedAt: existing.resolvedAt || new Date(),
      resolvedById: existing.resolvedById || req.user.id,
    },
  });

  res.json(new ApiResponse(200, updated, 'Support message resolved successfully.'));
});

module.exports = {
  createPublicContactMessage,
  listAdminSupportMessages,
  getAdminSupportMessageById,
  getAdminSupportStats,
  updateAdminSupportStatus,
  resolveAdminSupportMessage,
};
