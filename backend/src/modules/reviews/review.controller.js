const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { fileService } = require('../../services/file.service');
const notificationService = require('../../services/notification.service');
const logger = require('../../config/logger');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');

const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new ApiError(400, 'Rating must be an integer between 1 and 5');
  }

  const normalizedComment = String(comment || '').trim();
  if (normalizedComment.length > 500) {
    throw new ApiError(400, 'Comment should be less than or equal to 500 characters');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true, customer: true },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== req.user.id) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'COMPLETED') throw new ApiError(400, 'Can only review completed bookings');
  if (booking.paymentStatus && booking.paymentStatus !== 'PAID') {
    throw new ApiError(400, 'Can only review after payment is confirmed');
  }
  if (booking.review) throw new ApiError(409, 'Review already submitted for this booking');
  if (!booking.providerId) throw new ApiError(400, 'No provider to review');

  // Upload photos if any
  const photoUrls = [];
  const photoPublicIds = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await fileService.uploadToCloudinary(file, `reviews/${bookingId}`);
      photoUrls.push(result.secure_url);
      photoPublicIds.push(result.public_id);
    }
  }

  const review = await prisma.$transaction(async (tx) => {
    let r;
    try {
      r = await tx.review.create({
        data: {
          bookingId,
          authorId: req.user.id,
          rating: ratingNum,
          comment: normalizedComment || null,
          photos: photoUrls,
          photoPublicIds,
        },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ApiError(409, 'Review already submitted for this booking');
      }
      throw error;
    }

    // Update provider's stats
    const allReviews = await tx.review.findMany({
      where: {
        booking: { providerId: booking.providerId },
      },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await tx.providerProfile.update({
      where: { userId: booking.providerId },
      data: {
        averageRating: avgRating,
        totalReviews: allReviews.length,
      },
    });

    return r;
  });

  // Notify provider
  await notificationService.notifyReviewReceived(
    booking.providerId,
    booking.customer.name,
    ratingNum,
    booking.bookingCode
  );

  logger.info(`Review created for booking ${booking.bookingCode}`);
  res.status(201).json(new ApiResponse(201, review, 'Review created'));
});

const getProviderReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const where = {
    booking: { providerId: req.params.providerId },
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  res.json(new ApiResponse(200, reviews, 'Reviews fetched', buildPaginationMeta({ page, limit, total })));
});

const getMyReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const where = { authorId: req.user.id };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            provider: { select: { id: true, name: true, email: true, avatar: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  res.json(new ApiResponse(200, reviews, 'My reviews', buildPaginationMeta({ page, limit, total })));
});

const getReceivedReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const where = { booking: { providerId: req.user.id } };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  res.json(new ApiResponse(200, reviews, 'Received reviews', buildPaginationMeta({ page, limit, total })));
});

const getAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        booking: {
          include: {
            service: { select: { name: true } },
            provider: { select: { id: true, name: true, email: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count(),
  ]);

  res.json(new ApiResponse(200, reviews, 'All reviews', buildPaginationMeta({ page, limit, total })));
});

module.exports = { createReview, getProviderReviews, getMyReviews, getReceivedReviews, getAllReviews };
