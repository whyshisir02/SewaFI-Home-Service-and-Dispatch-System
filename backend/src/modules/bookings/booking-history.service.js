const { prisma } = require('../../config/database');

const createStatusHistory = async ({
  bookingId,
  status,
  actorUserId = null,
  actorRole = null,
  message = null,
  tx = prisma,
}) => {
  return tx.bookingStatusHistory.create({
    data: {
      bookingId,
      status,
      actorUserId,
      actorRole,
      message,
    },
  });
};

const getBookingTimeline = async (bookingId) => {
  return prisma.bookingStatusHistory.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
  });
};

module.exports = {
  createStatusHistory,
  getBookingTimeline,
};
