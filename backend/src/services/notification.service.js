const { prisma } = require('../config/database');
const { emitToUser, emitToPublic } = require('../config/socket');
const logger = require('../config/logger');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const webPushService = require('./web-push.service');

const ACTIVE_TABS = new Set(['active', 'unread', 'archived']);
const PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const PUSH_ELIGIBLE_TYPES = new Set([
  'NEW_JOB',
  'BOOKING_ACCEPTED',
  'STATUS_UPDATE',
  'REVIEW_REQUEST',
  'PAYMENT_DISPUTED',
  'NEW_PROVIDER_APPLICATION',
  'NEW_SUPPORT_MESSAGE',
]);

const PUSH_ALLOWED_STATUS_BY_ROLE = {
  CUSTOMER: new Set(['ACCEPTED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'EXPIRED']),
  PROVIDER: new Set(['COMPLETED', 'EXPIRED']),
  ADMIN: new Set(),
};

const toTab = (value) => {
  const normalized = String(value || 'active').trim().toLowerCase();
  return ACTIVE_TABS.has(normalized) ? normalized : 'active';
};

const toPriority = (value) => {
  const normalized = String(value || PRIORITY.NORMAL).trim().toUpperCase();
  if (Object.values(PRIORITY).includes(normalized)) return normalized;
  return PRIORITY.NORMAL;
};

const getTabWhere = (userId, tab) => {
  if (tab === 'archived') {
    return { userId, isArchived: true };
  }
  if (tab === 'unread') {
    return { userId, isArchived: false, isRead: false };
  }
  return { userId, isArchived: false };
};

const buildSearchWhere = (search) =>
  search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

const runInBackground = (task, context) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      logger.warn(`[notifications] ${context}: ${error?.message || error}`);
    });
};

const normalizeRole = (value) => String(value || 'CUSTOMER').trim().toUpperCase();

const hasExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
};

const isPushEligible = ({ type, priority, isArchived, expiresAt, data }) => {
  const normalizedType = String(type || '').trim().toUpperCase();
  if (!PUSH_ELIGIBLE_TYPES.has(normalizedType)) return false;
  if (String(priority || PRIORITY.NORMAL).toUpperCase() === PRIORITY.LOW) return false;
  if (isArchived) return false;
  if (hasExpired(expiresAt)) return false;

  if (normalizedType === 'STATUS_UPDATE') {
    const role = normalizeRole(data?.role);
    const status = String(data?.status || '').trim().toUpperCase();
    const allowed = PUSH_ALLOWED_STATUS_BY_ROLE[role] || new Set();
    return allowed.has(status);
  }

  return true;
};

const sendPushForNotification = async (userId, notification) => {
  if (!webPushService.isEnabled()) return;
  if (!isPushEligible(notification)) return;

  const actionUrl =
    notification.actionUrl ||
    notification.link ||
    notification?.data?.actionUrl ||
    '/notifications';

  await webPushService.sendToUser({
    userId,
    payload: {
      title: notification.title,
      body: notification.message,
      url: actionUrl,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      data: {
        notificationId: notification.id,
        type: notification.type,
        actionUrl,
      },
    },
  });
};

const createAndEmit = async (
  userId,
  type,
  title,
  message,
  linkOrOptions = null,
  dataArg = {}
) => {
  const options =
    linkOrOptions && typeof linkOrOptions === 'object' && !Array.isArray(linkOrOptions)
      ? linkOrOptions
      : { link: linkOrOptions, data: dataArg };

  const link = options.link || null;
  const actionUrl = options.actionUrl || link || null;
  const data = options.data || {};
  const metadata = options.metadata || null;
  const priority = toPriority(options.priority);
  const expiresAt = options.expiresAt ? new Date(options.expiresAt) : null;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      actionUrl,
      data,
      metadata,
      priority,
      expiresAt:
        expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    },
  });

  emitToUser(userId, 'notification:new', notification);
  runInBackground(
    () => sendPushForNotification(userId, notification),
    `push delivery failed for notification ${notification.id}`
  );
  return notification;
};

const notificationService = {
  notifyBookingAccepted: async (customerId, providerName, bookingCode, bookingId) => {
    return createAndEmit(
      customerId,
      'BOOKING_ACCEPTED',
      'Booking Accepted',
      `${providerName} accepted your booking #${bookingCode}`,
      {
        link: '/customer/bookings',
        actionUrl: `/customer/bookings/${bookingId}`,
        data: { bookingId, bookingCode },
        priority: PRIORITY.HIGH,
      }
    );
  },

  notifyStatusUpdate: async (userId, status, bookingCode, bookingId, role = 'CUSTOMER') => {
    const messages = {
      ACCEPTED: 'Booking accepted',
      IN_PROGRESS: 'Service has started',
      AWAITING_CONFIRMATION: 'Final amount submitted. Please confirm payment.',
      COMPLETED: 'Service completed. Please review!',
      EXPIRED: 'Booking expired because the scheduled service window passed.',
      CANCELLED: 'Booking has been cancelled',
      REJECTED: 'Booking was rejected',
    };
    const link = role === 'PROVIDER' ? '/provider/assigned-jobs' : '/customer/bookings';
    const roleUpper = normalizeRole(role);
    const actionUrl =
      roleUpper === 'PROVIDER'
        ? `/provider/assigned-jobs/${bookingId}`
        : roleUpper === 'ADMIN'
          ? '/admin/bookings'
          : `/customer/bookings/${bookingId}`;

    return createAndEmit(
      userId,
      'STATUS_UPDATE',
      'Booking Update',
      `${messages[status]} (#${bookingCode})`,
      {
        link,
        actionUrl,
        data: { status, bookingCode, bookingId, role: roleUpper },
        priority: ['CANCELLED', 'EXPIRED'].includes(status) ? PRIORITY.HIGH : PRIORITY.NORMAL,
      }
    );
  },

  notifyNewJob: async (providerId, serviceName, price, bookingId, extraData = {}) => {
    return createAndEmit(
      providerId,
      'NEW_JOB',
      'New Job Available',
      `${serviceName} - Rs. ${price}`,
      {
        link: '/provider/nearby-jobs',
        actionUrl: '/provider/nearby-jobs',
        data: { bookingId, serviceName, price, ...extraData },
        expiresAt: extraData.expiresAt || null,
        priority: PRIORITY.HIGH,
      }
    );
  },

  notifyReviewReceived: async (providerId, customerName, rating, bookingCode) => {
    return createAndEmit(
      providerId,
      'REVIEW_RECEIVED',
      'New Review',
      `${customerName} rated you ${rating} stars`,
      '/provider/reviews',
      { rating, bookingCode }
    );
  },

  notifyReviewRequest: async (customerId, bookingId, bookingCode) => {
    const actionUrl = `/customer/payments/${bookingId}?reviewPrompt=1`;
    const existing = await prisma.notification.findFirst({
      where: {
        userId: customerId,
        type: 'REVIEW_REQUEST',
        OR: [{ actionUrl }, { link: actionUrl }],
      },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    return createAndEmit(
      customerId,
      'REVIEW_REQUEST',
      'Service completed',
      'Your booking is completed. Please rate your experience with the provider.',
      {
        link: actionUrl,
        actionUrl,
        data: { bookingId, bookingCode, actionUrl },
        priority: PRIORITY.NORMAL,
      }
    );
  },

  notifyProviderApproved: async (providerId) => {
    return createAndEmit(
      providerId,
      'PROVIDER_APPROVED',
      'Application Approved',
      'You can now login and start accepting jobs',
      '/login',
      {}
    );
  },

  notifyProviderRejected: async (providerId, reason) => {
    return createAndEmit(
      providerId,
      'PROVIDER_REJECTED',
      'Application Rejected',
      `Reason: ${reason}`,
      '/login',
      { reason }
    );
  },

  notifyAdminNewProvider: async (providerName, category) => {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    for (const admin of admins) {
      await createAndEmit(
        admin.id,
        'NEW_PROVIDER_APPLICATION',
        'New Provider Application',
        `${providerName} applied for ${category}`,
        '/admin/providers',
        { providerName, category }
      );
    }
  },

  notifyPaymentDisputed: async (userId, bookingCode, bookingId) => {
    return createAndEmit(
      userId,
      'PAYMENT_DISPUTED',
      'Payment disputed',
      `Customer raised a payment dispute for booking #${bookingCode}.`,
      {
        link: '/provider/assigned-jobs',
        actionUrl: `/provider/assigned-jobs/${bookingId}`,
        data: { bookingId, bookingCode, role: 'PROVIDER', status: 'DISPUTED' },
        priority: PRIORITY.HIGH,
      }
    );
  },

  notifyAdminPaymentDisputed: async (bookingCode, bookingId) => {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    for (const admin of admins) {
      await createAndEmit(
        admin.id,
        'PAYMENT_DISPUTED',
        'Payment dispute raised',
        `A payment dispute was raised for booking #${bookingCode}.`,
        {
          link: '/admin/payments',
          actionUrl: '/admin/payments',
          data: { bookingId, bookingCode, role: 'ADMIN', status: 'DISPUTED' },
          priority: PRIORITY.HIGH,
        }
      );
    }
  },

  notifyAdminNewSupportMessage: async (ticketCode, subject) => {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    for (const admin of admins) {
      await createAndEmit(
        admin.id,
        'NEW_SUPPORT_MESSAGE',
        'New support message',
        `A new support message was submitted: ${subject}`,
        {
          link: '/admin/support',
          actionUrl: '/admin/support',
          data: { ticketCode, role: 'ADMIN' },
          priority: PRIORITY.HIGH,
        }
      );
    }
  },

  broadcastServiceUpdate: (action, service) => {
    emitToPublic('service:update', { action, service });
  },

  broadcastBookingUpdate: (booking) => {
    emitToPublic('booking:update', booking);
    if (booking.customerId) emitToUser(booking.customerId, 'booking:update', booking);
    if (booking.providerId) emitToUser(booking.providerId, 'booking:update', booking);
  },

  getUserNotifications: async (userId, query = {}) => {
    const { page, limit, skip, take } = getPagination(query);
    const search = String(query.search || '').trim();
    const status = String(query.status || '').trim().toLowerCase();
    const tab = toTab(query.tab || (status === 'unread' ? 'unread' : 'active'));
    const sort = String(query.sort || 'newest').trim().toLowerCase();

    const where = {
      ...getTabWhere(userId, tab),
      ...buildSearchWhere(search),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false, isArchived: false } }),
    ]);

    return {
      notifications,
      meta: {
        ...buildPaginationMeta({ page, limit, total }),
        unreadCount,
        tab,
      },
    };
  },

  getNotificationsForBell: async (userId, query = {}) => {
    const limit = Math.max(1, Math.min(Number(query.limit) || 6, 20));
    return prisma.notification.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  markAsRead: async (notificationId, userId) => {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { id: notificationId };
  },

  markAllAsRead: async (userId) => {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, isArchived: false },
      data: { isRead: true },
    });
  },

  archiveNotification: async (notificationId, userId) => {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true, isArchived: true },
    });

    if (!existing) return null;
    if (existing.isArchived) return { id: existing.id, archived: true, alreadyArchived: true };

    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    return { id: existing.id, archived: true, alreadyArchived: false };
  },

  unarchiveNotification: async (notificationId, userId) => {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true, isArchived: true },
    });

    if (!existing) return null;
    if (!existing.isArchived) return { id: existing.id, archived: false, alreadyActive: true };

    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });

    return { id: existing.id, archived: false, alreadyActive: false };
  },

  archiveReadNotifications: async (userId) => {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: true,
        isArchived: false,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    return { archivedCount: result.count || 0 };
  },

  getUnreadCount: async (userId) => {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isArchived: false,
      },
    });
  },

  deleteNotification: async (notificationId, userId) => {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (!existing) return null;

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return existing;
  },

  cleanupNotifications: async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const archivedRead = await prisma.notification.updateMany({
      where: {
        isRead: true,
        isArchived: false,
        createdAt: {
          lte: sevenDaysAgo,
        },
      },
      data: {
        isArchived: true,
        archivedAt: now,
      },
    });

    const archivedExpired = await prisma.notification.updateMany({
      where: {
        isArchived: false,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        isArchived: true,
        archivedAt: now,
      },
    });

    const deletedArchived = await prisma.notification.deleteMany({
      where: {
        isArchived: true,
        archivedAt: {
          lt: ninetyDaysAgo,
        },
        priority: {
          in: [PRIORITY.LOW, PRIORITY.NORMAL],
        },
        isRead: true,
        NOT: {
          type: {
            in: ['SECURITY', 'PAYMENT_DISPUTED', 'PAYMENT_UPDATED', 'PAYMENT_SETTLED'],
          },
        },
      },
    });

    const summary = {
      archivedReadCount: archivedRead.count || 0,
      archivedExpiredCount: archivedExpired.count || 0,
      deletedArchivedCount: deletedArchived.count || 0,
    };

    logger.info(
      `[notifications] cleanup complete: archivedRead=${summary.archivedReadCount}, archivedExpired=${summary.archivedExpiredCount}, deletedArchived=${summary.deletedArchivedCount}`
    );

    return summary;
  },
};

module.exports = notificationService;
