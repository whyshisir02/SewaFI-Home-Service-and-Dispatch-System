const { Server } = require('socket.io');
const logger = require('./logger');
const env = require('./env');
const { prisma } = require('./database');
const { allowedOrigins } = require('./origins');
const { verifyAccessToken } = require('../utils/jwt');

let io;
const userSockets = new Map();
const liveTrackingState = new Map();

const getBookingRoom = (bookingId) => `booking:${bookingId}`;
const getTrackState = (bookingId) => liveTrackingState.get(bookingId) || {};

const canAccessBookingTracking = async (userId, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      customerId: true,
      providerId: true,
    },
  });

  if (!booking) {
    return { allowed: false, reason: 'Booking not found' };
  }

  if (!['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
    return { allowed: false, reason: 'Live tracking is available only for active bookings' };
  }

  if (![booking.customerId, booking.providerId].includes(userId)) {
    return { allowed: false, reason: 'You are not part of this booking' };
  }

  return { allowed: true };
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
      const token = String(rawToken).replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return next(new Error('Unauthorized socket connection'));
      }

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('Unauthorized socket connection'));
      }

      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch (error) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    const { userId, role } = socket.data;
    userSockets.set(userId, socket.id);
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    logger.info(`User ${userId} (${role}) authenticated on socket`);

    // Compatibility event: keep the event name but ignore client-provided identity.
    socket.on('join', () => {
      socket.emit('join:ack', {
        userId: socket.data.userId,
        role: socket.data.role,
      });
    });

    socket.on('joinPublic', () => {
      socket.join('public');
    });

    socket.on('tracking:subscribe', async ({ bookingId }) => {
      try {
        if (!socket.data.userId || !bookingId) {
          socket.emit('tracking:error', { bookingId, message: 'Missing booking or user context' });
          return;
        }

        const access = await canAccessBookingTracking(socket.data.userId, bookingId);
        if (!access.allowed) {
          socket.emit('tracking:error', { bookingId, message: access.reason });
          return;
        }

        socket.join(getBookingRoom(bookingId));
        socket.emit('tracking:snapshot', {
          bookingId,
          locations: getTrackState(bookingId),
        });
      } catch (error) {
        logger.error(`Tracking subscribe failed: ${error.message}`);
      }
    });

    socket.on('tracking:update', async ({ bookingId, latitude, longitude, accuracy = null }) => {
      try {
        if (!socket.data.userId || !socket.data.role || !bookingId) {
          return;
        }

        const access = await canAccessBookingTracking(socket.data.userId, bookingId);
        if (!access.allowed) {
          socket.emit('tracking:error', { bookingId, message: access.reason });
          return;
        }

        const parsedLatitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const parsedLongitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
        const parsedAccuracy = typeof accuracy === 'string' ? parseFloat(accuracy) : accuracy;

        if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
          socket.emit('tracking:error', { bookingId, message: 'Invalid coordinates' });
          return;
        }

        const actorRole = socket.data.role;
        const location = {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          accuracy: Number.isFinite(parsedAccuracy) ? parsedAccuracy : null,
          updatedAt: new Date().toISOString(),
        };

        liveTrackingState.set(bookingId, {
          ...getTrackState(bookingId),
          [actorRole]: location,
        });

        io.to(getBookingRoom(bookingId)).emit('tracking:update', {
          bookingId,
          actorRole,
          location,
        });
      } catch (error) {
        logger.error(`Tracking update failed: ${error.message}`);
      }
    });

    socket.on('tracking:stop', async ({ bookingId }) => {
      try {
        if (!socket.data.userId || !socket.data.role || !bookingId) {
          return;
        }

        const access = await canAccessBookingTracking(socket.data.userId, bookingId);
        if (!access.allowed) {
          return;
        }

        const actorRole = socket.data.role;
        const snapshot = { ...getTrackState(bookingId) };
        delete snapshot[actorRole];

        if (Object.keys(snapshot).length === 0) {
          liveTrackingState.delete(bookingId);
        } else {
          liveTrackingState.set(bookingId, snapshot);
        }

        io.to(getBookingRoom(bookingId)).emit('tracking:stop', {
          bookingId,
          actorRole,
        });
      } catch (error) {
        logger.error(`Tracking stop failed: ${error.message}`);
      }
    });

    socket.on('disconnect', () => {
      userSockets.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userSockets.delete(userId);
        }
      });
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;

  io.to(`user:${userId}`).emit(event, data);
  logger.info(`${event} -> user:${userId}`);
};

const emitToRole = (role, event, data) => {
  if (!io) return;

  io.to(`role:${role}`).emit(event, data);
  logger.info(`${event} -> role:${role}`);
};

const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};

const emitToPublic = (event, data) => {
  if (io) io.to('public').emit(event, data);
};

module.exports = { initializeSocket, emitToUser, emitToRole, emitToAll, emitToPublic };
