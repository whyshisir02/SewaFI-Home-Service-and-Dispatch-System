const { prisma } = require('../config/database');
const { emitToUser, emitToPublic } = require('../config/socket');
const logger = require('../config/logger');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const createAndEmit = async (userId, type, title, message, link = null, data = {}) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link, data },
  });
  emitToUser(userId, 'notification:new', notification);
  return notification;
};

const notificationService = {
  notifyBookingAccepted: async (customerId, providerName, bookingCode, bookingId) => {
    return createAndEmit(
      customerId,
      'BOOKING_ACCEPTED',
      'Booking Accepted',
      `${providerName} accepted your booking #${bookingCode}`,
      '/customer/bookings',
      { bookingId, bookingCode }
    );
  },

  notifyStatusUpdate: async (userId, status, bookingCode, bookingId, role = 'CUSTOMER') => {
    const messages = {
      ACCEPTED: 'Booking accepted',
      IN_PROGRESS: 'Service has started',
      COMPLETED: 'Service completed. Please review!',
      CANCELLED: 'Booking has been cancelled',
      REJECTED: 'Booking was rejected',
    };
    const link = role === 'PROVIDER' ? '/provider/assigned-jobs' : '/customer/bookings';
    return createAndEmit(
      userId,
      'STATUS_UPDATE',
      'Booking Update',
      `${messages[status]} (#${bookingCode})`,
      link,
      { status, bookingCode, bookingId }
    );
  },

  notifyNewJob: async (providerId, serviceName, price, bookingId, extraData = {}) => {
    return createAndEmit(
      providerId,
      'NEW_JOB',
      'New Job Available',
      `${serviceName} - Rs. ${price}`,
      '/provider/nearby-jobs',
      { bookingId, serviceName, price, ...extraData }
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
    const link = `/customer/bookings/${bookingId}`;
    const existing = await prisma.notification.findFirst({
      where: {
        userId: customerId,
        type: 'REVIEW_REQUEST',
        link,
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
      link,
      { bookingId, bookingCode, actionUrl: link }
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
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createAndEmit(
        admin.id,
        'NEW_PROVIDER_APPLICATION',
        'New Provider Application',
        `${providerName} applied for ${category}`,
        '/admin/providers/pending',
        { providerName, category }
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
    const sort = String(query.sort || 'newest').trim().toLowerCase();

    const where = {
      userId,
      ...(status === 'read' ? { isRead: true } : {}),
      ...(status === 'unread' ? { isRead: false } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { message: { contains: search, mode: 'insensitive' } },
              { type: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      meta: {
        ...buildPaginationMeta({ page, limit, total }),
        unreadCount,
      },
    };
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
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  getUnreadCount: async (userId) => {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  deleteNotification: async (notificationId, userId) => {
    const existing = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return existing;
  },
};

module.exports = notificationService;
