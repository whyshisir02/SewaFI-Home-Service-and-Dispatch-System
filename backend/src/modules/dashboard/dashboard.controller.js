const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getPeriodStarts = () => {
  const now = new Date();
  return {
    startOfDay: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    sevenDaysAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    startOfYear: new Date(now.getFullYear(), 0, 1),
  };
};

const buildPaidCompletedPaymentWhere = (bookingWhere = {}) => ({
  paymentStatus: 'PAID',
  booking: {
    is: {
      status: 'COMPLETED',
      ...bookingWhere,
    },
  },
});

const moneyBucket = (aggregate, amountKey = 'finalAmount') => ({
  amount: aggregate?._sum?.[amountKey] || 0,
  count:
    typeof aggregate?._count === 'number'
      ? aggregate._count
      : aggregate?._count?._all || 0,
});

const getCustomerSummary = async (userId) => {
  const { startOfDay, sevenDaysAgo, startOfMonth, startOfYear } = getPeriodStarts();
  const paidCompletedWhere = {
    ...buildPaidCompletedPaymentWhere(),
    customerId: userId,
  };

  const [today, last7days, thisMonth, thisYear, total, active, completed] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfDay },
          },
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: sevenDaysAgo },
          },
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfMonth },
          },
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfYear },
          },
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: paidCompletedWhere,
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.booking.count({
      where: { customerId: userId, status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } },
    }),
    prisma.booking.count({ where: { customerId: userId, status: 'COMPLETED' } }),
  ]);

  return {
    role: 'CUSTOMER',
    spending: {
      today: moneyBucket(today, 'finalAmount'),
      last7days: moneyBucket(last7days, 'finalAmount'),
      thisMonth: moneyBucket(thisMonth, 'finalAmount'),
      thisYear: moneyBucket(thisYear, 'finalAmount'),
      total: moneyBucket(total, 'finalAmount'),
    },
    bookings: { active, completed },
  };
};

const getProviderSummary = async (userId) => {
  const { startOfDay, sevenDaysAgo, startOfMonth, startOfYear } = getPeriodStarts();
  const paidCompletedWhere = {
    ...buildPaidCompletedPaymentWhere(),
    providerId: userId,
  };

  const [profile, today, last7days, thisMonth, thisYear, total, activeBooking] = await Promise.all([
    prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        availability: true,
        totalJobs: true,
        averageRating: true,
        totalReviews: true,
        totalEarnings: true,
        isCurrentlyBusy: true,
        category: { select: { id: true, name: true, icon: true } },
      },
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfDay },
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: sevenDaysAgo },
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfMonth },
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        ...paidCompletedWhere,
        booking: {
          is: {
            ...paidCompletedWhere.booking.is,
            completedAt: { gte: startOfYear },
          },
        },
      },
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: paidCompletedWhere,
      _sum: { providerEarningAmount: true },
      _count: true,
    }),
    prisma.booking.findFirst({
      where: { providerId: userId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        scheduledTime: true,
        address: true,
        totalPrice: true,
        service: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    }),
  ]);

  return {
    role: 'PROVIDER',
    profile,
    activeBooking,
    earnings: {
      today: moneyBucket(today, 'providerEarningAmount'),
      last7days: moneyBucket(last7days, 'providerEarningAmount'),
      thisMonth: moneyBucket(thisMonth, 'providerEarningAmount'),
      thisYear: moneyBucket(thisYear, 'providerEarningAmount'),
      total: moneyBucket(total, 'providerEarningAmount'),
    },
  };
};

const getAdminSummary = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [
    totalUsers,
    totalCustomers,
    totalProviders,
    pendingProviders,
    totalServices,
    totalCategories,
    totalBookings,
    bookingsToday,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalPlatformCommission,
    totalProviderEarnings,
    totalReviews,
    avgRating,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'PROVIDER', providerProfile: { status: 'APPROVED' } } }),
    prisma.user.count({ where: { role: 'PROVIDER', providerProfile: { status: 'PENDING_APPROVAL' } } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.serviceCategory.count(),
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: startOfTomorrow,
        },
      },
    }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.payment.aggregate({
      where: buildPaidCompletedPaymentWhere(),
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: buildPaidCompletedPaymentWhere({ completedAt: { gte: startOfMonth } }),
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: buildPaidCompletedPaymentWhere({
        completedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      }),
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: buildPaidCompletedPaymentWhere(),
      _sum: { platformFeeAmount: true },
    }),
    prisma.payment.aggregate({
      where: buildPaidCompletedPaymentWhere(),
      _sum: { providerEarningAmount: true },
    }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  const monthRev = parseFloat(monthRevenue._sum.finalAmount || 0);
  const lastMonthRev = parseFloat(lastMonthRevenue._sum.finalAmount || 0);

  return {
    role: 'ADMIN',
    users: {
      total: totalUsers,
      customers: totalCustomers,
      providers: totalProviders,
      pendingProviders,
    },
    services: { total: totalServices, categories: totalCategories },
    bookings: {
      total: totalBookings,
      today: bookingsToday,
      pending: pendingBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    revenue: {
      total: totalRevenue._sum.finalAmount || 0,
      thisMonth: monthRev,
      lastMonth: lastMonthRev,
      growth: lastMonthRev > 0 ? (((monthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(2) : '0.00',
      platformCommission: totalPlatformCommission._sum.platformFeeAmount || 0,
      providerEarnings: totalProviderEarnings._sum.providerEarningAmount || 0,
    },
    reviews: {
      total: totalReviews,
      averageRating: parseFloat(avgRating._avg.rating || 0).toFixed(2),
    },
  };
};

const getSummary = asyncHandler(async (req, res) => {
  let data;

  if (req.user.role === 'CUSTOMER') {
    data = await getCustomerSummary(req.user.id);
  } else if (req.user.role === 'PROVIDER') {
    data = await getProviderSummary(req.user.id);
  } else if (req.user.role === 'ADMIN') {
    data = await getAdminSummary();
  } else {
    throw new ApiError(403, 'Unsupported dashboard role');
  }

  res.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=60');
  res.json(new ApiResponse(200, data, 'Dashboard summary'));
});

module.exports = { getSummary };
