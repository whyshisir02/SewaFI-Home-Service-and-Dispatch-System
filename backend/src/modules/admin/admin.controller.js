const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const notificationService = require('../../services/notification.service');
const { emitToPublic } = require('../../config/socket');
const logger = require('../../config/logger');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const { CACHE_KEYS, deleteManyCache } = require('../../utils/cache');

const buildPaidCompletedPaymentWhere = (bookingWhere = {}) => ({
  paymentStatus: 'PAID',
  booking: {
    is: {
      status: 'COMPLETED',
      ...bookingWhere,
    },
  },
});

const mapAccountStatus = (user) => {
  if (!user?.isActive) return 'SUSPENDED';
  if (!user?.isEmailVerified) return 'EMAIL_UNVERIFIED';
  return 'ACTIVE';
};

const normalizeAdminUser = (user) => {
  const providerStatus = user?.role === 'PROVIDER' ? user?.providerProfile?.status || null : null;
  return {
    ...user,
    isVerified: Boolean(user?.isEmailVerified),
    accountStatus: mapAccountStatus(user),
    providerStatus,
  };
};

// === PROVIDER APPROVAL ===

const getPendingProviders = asyncHandler(async (req, res) => {
  const providers = await prisma.user.findMany({
    where: {
      role: 'PROVIDER',
      providerProfile: { status: 'PENDING_APPROVAL' },
    },
    include: {
      providerProfile: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(new ApiResponse(200, providers, 'Pending providers'));
});

const approveProvider = asyncHandler(async (req, res) => {
  const provider = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { providerProfile: true },
  });

  if (!provider || !provider.providerProfile) throw new ApiError(404, 'Provider not found');

  await prisma.$transaction([
    prisma.providerProfile.update({
      where: { userId: req.params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: req.user.id,
      },
    }),
    prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
    }),
  ]);

  await notificationService.notifyProviderApproved(provider.id);

  emitToPublic('provider:approved', { providerId: provider.id, name: provider.name });

  logger.info(`Provider ${provider.email} approved by admin`);
  res.json(new ApiResponse(200, {}, 'Provider approved'));
});

const rejectProvider = asyncHandler(async (req, res) => {
  const reason = req.body.reason || req.body.rejectionReason;

  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'Rejection reason required');
  }

  const providerProfile = await prisma.providerProfile.findFirst({
    where: {
      OR: [
        { id: req.params.id },
        { userId: req.params.id },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
      category: true,
    },
  });

  if (!providerProfile || !providerProfile.user) {
    throw new ApiError(404, 'Provider not found');
  }

  const updatedProfile = await prisma.providerProfile.update({
    where: { id: providerProfile.id },
    data: {
      status: 'REJECTED',
      rejectionReason: String(reason).trim(),
      approvedAt: null,
      approvedBy: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
      category: true,
    },
  });

  Promise.resolve()
    .then(() =>
      notificationService.notifyProviderRejected(
        providerProfile.userId,
        String(reason).trim()
      )
    )
    .catch((error) => {
      logger.error(`[rejectProvider] Notification failed: ${error.message}`);
    });

  res.json(
    new ApiResponse(
      200,
      updatedProfile,
      'Provider rejected successfully'
    )
  );
});

// === ANALYTICS ===

const getDashboardStats = asyncHandler(async (req, res) => {
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
  const revenueGrowth = lastMonthRev > 0 ? ((monthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  res.json(
    new ApiResponse(200, {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        pendingProviders,
      },
      services: {
        total: totalServices,
        categories: totalCategories,
      },
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
        growth: revenueGrowth.toFixed(2),
        platformCommission: totalPlatformCommission._sum.platformFeeAmount || 0,
        providerEarnings: totalProviderEarnings._sum.providerEarningAmount || 0,
      },
      reviews: {
        total: totalReviews,
        averageRating: parseFloat(avgRating._avg.rating || 0).toFixed(2),
      },
    }, 'Dashboard stats')
  );
});

// Revenue chart (last 12 months)
const getRevenueChart = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthsData = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const result = await prisma.payment.aggregate({
      where: {
        paymentStatus: 'PAID',
        booking: {
          is: {
            status: 'COMPLETED',
            completedAt: { gte: start, lte: end },
          },
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    });

    monthsData.push({
      month: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: parseFloat(result._sum.finalAmount || 0),
      bookings:
        typeof result._count === 'number'
          ? result._count
          : result?._count?._all || 0,
    });
  }

  res.json(new ApiResponse(200, monthsData, 'Revenue chart'));
});

// Most active providers this month
const getTopProviders = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const topProviders = await prisma.payment.groupBy({
    by: ['providerId'],
    where: {
      paymentStatus: 'PAID',
      providerId: { not: null },
      booking: {
        is: {
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      },
    },
    _count: { id: true },
    _sum: { finalAmount: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const providerData = await Promise.all(
    topProviders.map(async (p) => {
      const user = await prisma.user.findUnique({
        where: { id: p.providerId },
        select: { id: true, name: true, avatar: true, email: true },
      });
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: p.providerId },
        include: { category: true },
      });
      return {
        ...user,
        category: profile?.category?.name,
        averageRating: profile?.averageRating,
        completedJobs: p._count.id,
        revenue: parseFloat(p._sum.finalAmount || 0),
      };
    })
  );

  res.json(new ApiResponse(200, providerData, 'Top providers this month'));
});

// Category-wise booking analytics
const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await prisma.serviceCategory.findMany({
    select: {
      id: true,
      name: true,
      icon: true,
      services: {
        select: {
          bookings: {
            where: { status: 'COMPLETED' },
            select: {
              payment: {
                select: {
                  paymentStatus: true,
                  finalAmount: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const result = stats.map((cat) => {
    let totalBookings = 0;
    let totalRevenue = 0;
    cat.services.forEach((s) => {
      totalBookings += s.bookings.length;
      totalRevenue += s.bookings.reduce((sum, b) => {
        if (b.payment?.paymentStatus !== 'PAID') {
          return sum;
        }
        return sum + parseFloat(b.payment?.finalAmount || 0);
      }, 0);
    });
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      totalBookings,
      totalRevenue,
    };
  });

  result.sort((a, b) => b.totalBookings - a.totalBookings);

  res.json(new ApiResponse(200, result, 'Category stats'));
});

// Booking status distribution
const getBookingStatusStats = asyncHandler(async (req, res) => {
  const statuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];
  const stats = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.booking.count({ where: { status } }),
    }))
  );

  res.json(new ApiResponse(200, stats, 'Booking status stats'));
});

// Recent bookings
const getRecentBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, avatar: true } },
      provider: { select: { name: true, avatar: true } },
      service: { select: { name: true } },
    },
  });

  res.json(new ApiResponse(200, bookings, 'Recent bookings'));
});

// All reviews for admin
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true } },
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, name: true, email: true, avatar: true } },
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(new ApiResponse(200, reviews, 'All reviews'));
});

const getAdminBookingById = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      service: { include: { category: true, subCategory: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
      provider: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
          providerProfile: {
            select: {
              id: true,
              status: true,
              averageRating: true,
              totalJobs: true,
            },
          },
        },
      },
      review: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
      providerNotifications: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json(new ApiResponse(200, booking, 'Admin booking fetched'));
});

const getAdminProviderById = asyncHandler(async (req, res) => {
  const provider = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: 'PROVIDER',
    },
    include: {
      providerProfile: {
        include: {
          category: true,
          subCategories: { include: { subCategory: true } },
          serviceAreas: true,
          services: {
            include: {
              service: true,
            },
          },
          bookingNotifications: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  });

  if (!provider) {
    throw new ApiError(404, 'Provider not found');
  }

  res.json(new ApiResponse(200, provider, 'Admin provider fetched'));
});

const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      providerProfile: {
        include: {
          category: true,
          subCategories: { include: { subCategory: true } },
          serviceAreas: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, normalizeAdminUser(user), 'Admin user fetched'));
});

const getAdminManagedUser = async (id) =>
  prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      providerProfile: {
        include: { category: true },
      },
      _count: {
        select: {
          customerBookings: true,
          providerBookings: true,
          reviewsGiven: true,
          notifications: true,
          refreshTokens: true,
          customerPayments: true,
          providerPayments: true,
          customerAddresses: true,
        },
      },
    },
  });

const ensureAdminNotSelfAction = (adminUserId, targetUserId) => {
  if (String(adminUserId) === String(targetUserId)) {
    throw new ApiError(400, 'You cannot modify your own account status');
  }
};

const suspendAdminUser = asyncHandler(async (req, res) => {
  ensureAdminNotSelfAction(req.user.id, req.params.id);

  const targetUser = await getAdminManagedUser(req.params.id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (!targetUser.isActive) {
    return res.json(new ApiResponse(200, normalizeAdminUser(targetUser), 'User is already suspended'));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    include: {
      providerProfile: {
        include: { category: true },
      },
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });

  res.json(new ApiResponse(200, normalizeAdminUser(updatedUser), 'User suspended successfully'));
});

const activateAdminUser = asyncHandler(async (req, res) => {
  ensureAdminNotSelfAction(req.user.id, req.params.id);

  const targetUser = await getAdminManagedUser(req.params.id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.isActive) {
    return res.json(new ApiResponse(200, normalizeAdminUser(targetUser), 'User is already active'));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: true },
    include: {
      providerProfile: {
        include: { category: true },
      },
    },
  });

  res.json(new ApiResponse(200, normalizeAdminUser(updatedUser), 'User activated successfully'));
});

const deleteAdminUser = asyncHandler(async (req, res) => {
  ensureAdminNotSelfAction(req.user.id, req.params.id);

  const targetUser = await getAdminManagedUser(req.params.id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const dependencyCounts = targetUser._count || {};
  const hasRelatedData = Object.values(dependencyCounts).some((count) => Number(count) > 0);

  // Safe delete policy: always soft-deactivate user to preserve relational integrity.
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    include: {
      providerProfile: {
        include: { category: true },
      },
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });

  const message = hasRelatedData
    ? 'User has related records and was safely deactivated'
    : 'User deactivated successfully';

  res.json(
    new ApiResponse(
      200,
      {
        ...normalizeAdminUser(updatedUser),
        deleteMode: 'SOFT_DEACTIVATE',
        hasRelatedData,
      },
      message
    )
  );
});

const listAdminUsers = asyncHandler(async (req, res) => {
  const {
    role,
    search = '',
    sort = 'newest',
    accountStatus = 'ALL',
    verificationStatus = 'ALL',
  } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();

  const where = {
    ...(role ? { role } : {}),
  };

  const andWhere = [];

  if (trimmedSearch) {
    andWhere.push({
      OR: [
        { name: { contains: trimmedSearch, mode: 'insensitive' } },
        { email: { contains: trimmedSearch, mode: 'insensitive' } },
        { phone: { contains: trimmedSearch, mode: 'insensitive' } },
      ],
    });
  }

  const normalizedAccountStatus = String(accountStatus || 'ALL').toUpperCase();
  if (normalizedAccountStatus === 'ACTIVE') {
    andWhere.push({ isActive: true });
    andWhere.push({
      OR: [
        { role: { in: ['CUSTOMER', 'ADMIN'] } },
        { role: 'PROVIDER', providerProfile: { status: 'APPROVED' } },
      ],
    });
  } else if (normalizedAccountStatus === 'SUSPENDED') {
    andWhere.push({ isActive: false });
  }

  const normalizedVerificationStatus = String(verificationStatus || 'ALL').toUpperCase();
  if (normalizedVerificationStatus === 'VERIFIED') {
    andWhere.push({ isEmailVerified: true });
  } else if (normalizedVerificationStatus === 'UNVERIFIED') {
    andWhere.push({ isEmailVerified: false });
  } else if (normalizedVerificationStatus === 'APPROVED_PROVIDER') {
    andWhere.push({ role: 'PROVIDER', providerProfile: { status: 'APPROVED' } });
  } else if (normalizedVerificationStatus === 'PENDING_PROVIDER') {
    andWhere.push({ role: 'PROVIDER', providerProfile: { status: 'PENDING_APPROVAL' } });
  } else if (normalizedVerificationStatus === 'REJECTED_PROVIDER') {
    andWhere.push({ role: 'PROVIDER', providerProfile: { status: 'REJECTED' } });
  }

  if (andWhere.length) {
    where.AND = andWhere;
  }

  const normalizedSort = String(sort).toLowerCase();
  let orderBy = { createdAt: normalizedSort === 'oldest' ? 'asc' : 'desc' };
  if (normalizedSort === 'name_asc') {
    orderBy = { name: 'asc' };
  } else if (normalizedSort === 'name_desc') {
    orderBy = { name: 'desc' };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        providerProfile: {
          include: { category: true },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  const normalizedUsers = users.map(normalizeAdminUser);

  res.json(
    new ApiResponse(
      200,
      normalizedUsers,
      'Admin users fetched',
      buildPaginationMeta({ page, limit, total })
    )
  );
});

const listAdminProviders = asyncHandler(async (req, res) => {
  const { status, search = '', sort = 'newest' } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();
  const where = {
    role: 'PROVIDER',
    providerProfile: {
      ...(status ? { status } : {}),
    },
    ...(trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: 'insensitive' } },
            { email: { contains: trimmedSearch, mode: 'insensitive' } },
            { phone: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [providers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        providerProfile: {
          include: {
            category: true,
            subCategories: { include: { subCategory: true } },
            serviceAreas: true,
          },
        },
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  res.json(new ApiResponse(200, providers, 'Admin providers fetched', buildPaginationMeta({ page, limit, total })));
});

const listAdminBookings = asyncHandler(async (req, res) => {
  const { status, search = '', sort = 'newest' } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();
  const where = {
    ...(status ? { status } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { bookingCode: { contains: trimmedSearch, mode: 'insensitive' } },
            { service: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
            { customer: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
            { provider: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: { include: { category: true, subCategory: true } },
        customer: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        provider: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        review: true,
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json(new ApiResponse(200, bookings, 'Admin bookings fetched', buildPaginationMeta({ page, limit, total })));
});

const listAdminServices = asyncHandler(async (req, res) => {
  const { category, categoryId, search = '', sort = 'newest', isActive } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();
  const requestedCategoryId = categoryId || category;
  const normalizedSort = String(sort).toLowerCase();
  const parsedIsActive =
    isActive === undefined
      ? undefined
      : isActive === true || isActive === 'true'
        ? true
        : isActive === false || isActive === 'false'
          ? false
          : undefined;

  let orderBy = { createdAt: normalizedSort === 'oldest' ? 'asc' : 'desc' };
  if (normalizedSort === 'name_asc') {
    orderBy = { name: 'asc' };
  } else if (normalizedSort === 'name_desc') {
    orderBy = { name: 'desc' };
  }

  const where = {
    ...(requestedCategoryId ? { categoryId: requestedCategoryId } : {}),
    ...(parsedIsActive === undefined ? {} : { isActive: parsedIsActive }),
    ...(trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: 'insensitive' } },
            { description: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: true,
        subCategory: true,
      },
      orderBy,
      skip,
      take,
    }),
    prisma.service.count({ where }),
  ]);

  res.json(new ApiResponse(200, services, 'Admin services fetched', buildPaginationMeta({ page, limit, total })));
});

const listAdminCategories = asyncHandler(async (req, res) => {
  const { search = '', sort = 'newest' } = req.query;
  const { page, limit, skip, take } = getPagination(req.query);
  const trimmedSearch = String(search).trim();
  const where = trimmedSearch
    ? {
        OR: [
          { name: { contains: trimmedSearch, mode: 'insensitive' } },
          { description: { contains: trimmedSearch, mode: 'insensitive' } },
        ],
      }
    : {};

  const [categories, total] = await Promise.all([
    prisma.serviceCategory.findMany({
      where,
      include: {
        subCategories: true,
        _count: {
          select: {
            services: true,
            subCategories: true,
            providerProfiles: true,
          },
        },
      },
      orderBy: { createdAt: String(sort).toLowerCase() === 'oldest' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.serviceCategory.count({ where }),
  ]);

  const normalizedCategories = categories.map((category) => ({
    ...category,
    serviceCount: category?._count?.services ?? 0,
    subCategoryCount: category?._count?.subCategories ?? 0,
    providerCount: category?._count?.providerProfiles ?? 0,
  }));

  res.json(
    new ApiResponse(
      200,
      normalizedCategories,
      'Admin categories fetched',
      buildPaginationMeta({ page, limit, total })
    )
  );
});

const getUserStats = asyncHandler(async (req, res) => {
  const [total, customers, providers, admins, verified, suspended] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({
      where: {
        role: 'PROVIDER',
        isActive: true,
        providerProfile: { status: 'APPROVED' },
      },
    }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isEmailVerified: true } }),
    prisma.user.count({ where: { isActive: false } }),
  ]);

  const roleTotal = customers + providers + admins;
  const others = Math.max(total - roleTotal, 0);

  res.json(
    new ApiResponse(
      200,
      {
        total,
        customers,
        providers,
        admins,
        verified,
        suspended,
        ...(others > 0 ? { others } : {}),
      },
      'Admin user stats fetched'
    )
  );
});

const getProviderStats = asyncHandler(async (req, res) => {
  const [total, pending, approved, rejected, suspended] = await Promise.all([
    prisma.providerProfile.count(),
    prisma.providerProfile.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.providerProfile.count({ where: { status: 'APPROVED' } }),
    prisma.providerProfile.count({ where: { status: 'REJECTED' } }),
    prisma.providerProfile.count({ where: { status: 'SUSPENDED' } }),
  ]);

  res.json(
    new ApiResponse(200, { total, pending, approved, rejected, suspended }, 'Admin provider stats fetched')
  );
});

const getBookingStats = asyncHandler(async (req, res) => {
  const [total, pending, accepted, inProgress, completed, cancelled] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'ACCEPTED' } }),
    prisma.booking.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
  ]);

  res.json(
    new ApiResponse(
      200,
      { total, pending, accepted, inProgress, completed, cancelled },
      'Admin booking stats fetched'
    )
  );
});

const getServiceStats = asyncHandler(async (req, res) => {
  const [services, activeServices, inactiveServices, categories, subCategories] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.service.count({ where: { isActive: false } }),
    prisma.serviceCategory.count(),
    prisma.subCategory.count(),
  ]);

  res.json(
    new ApiResponse(
      200,
      { services, activeServices, inactiveServices, categories, subCategories },
      'Admin service stats fetched'
    )
  );
});

const getCategoryAdminStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, categoryRows] = await Promise.all([
    prisma.serviceCategory.count(),
    prisma.serviceCategory.count({ where: { isActive: true } }),
    prisma.serviceCategory.count({ where: { isActive: false } }),
    prisma.serviceCategory.findMany({
      select: {
        id: true,
        _count: {
          select: {
            services: true,
          },
        },
      },
    }),
  ]);

  const withServices = categoryRows.filter((row) => Number(row?._count?.services || 0) > 0).length;
  const emptyCategories = total - withServices;

  res.json(
    new ApiResponse(
      200,
      {
        total,
        active,
        inactive,
        withServices,
        emptyCategories,
      },
      'Admin category stats fetched'
    )
  );
});

const updateServiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value');
  }

  const existingService = await prisma.service.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!existingService) {
    throw new ApiError(404, 'Service not found');
  }

  const service = await prisma.service.update({
    where: { id },
    data: { isActive },
    include: {
      category: true,
      subCategory: true,
    },
  });

  await deleteManyCache([
    CACHE_KEYS.servicesCategories,
    CACHE_KEYS.servicesSubcategories,
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        ...service,
        imageUrl: service.imageUrl || service.image || null,
      },
      isActive ? 'Service activated successfully' : 'Service deactivated successfully'
    )
  );
});

const updateCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value');
  }

  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!existingCategory) {
    throw new ApiError(404, 'Category not found');
  }

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: { isActive },
    include: {
      subCategories: {
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { services: true },
      },
    },
  });

  await deleteManyCache([
    CACHE_KEYS.servicesCategories,
    CACHE_KEYS.servicesSubcategories,
    CACHE_KEYS.serviceCategory(category.slug),
  ]);

  res.json(
    new ApiResponse(
      200,
      category,
      isActive ? 'Category activated successfully' : 'Category deactivated successfully'
    )
  );
});

module.exports = {
  getPendingProviders,
  approveProvider,
  rejectProvider,
  getDashboardStats,
  getRevenueChart,
  getTopProviders,
  getCategoryStats,
  getBookingStatusStats,
  getRecentBookings,
  getAllReviews,
  listAdminUsers,
  listAdminProviders,
  listAdminBookings,
  listAdminServices,
  listAdminCategories,
  getAdminBookingById,
  getAdminProviderById,
  getAdminUserById,
  suspendAdminUser,
  activateAdminUser,
  deleteAdminUser,
  getUserStats,
  getProviderStats,
  getBookingStats,
  getServiceStats,
  getCategoryAdminStats,
  updateServiceStatus,
  updateCategoryStatus,
};
