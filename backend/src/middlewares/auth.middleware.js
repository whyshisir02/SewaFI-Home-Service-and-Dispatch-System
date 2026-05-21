const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../config/database');
const APPROVED_PROVIDER_MESSAGE = 'Provider profile is not approved';

const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized - No token provided');
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        providerProfile: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = user;
    next();
  } catch (err) {
  if (err instanceof ApiError) {
    return next(err);
  }

  next(new ApiError(401, err.message || 'Unauthorized'));
}
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }
    next();
  };

  

const requireApprovedProvider = async (req, res, next) => {
  try {
    if (req.user?.role !== 'PROVIDER') {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!providerProfile) {
      return next(new ApiError(404, 'Provider profile not found'));
    }

    if (providerProfile.status !== 'APPROVED') {
      return next(
        new ApiError(
          403,
          APPROVED_PROVIDER_MESSAGE,
          [],
          { providerStatus: providerProfile.status }
        )
      );
    }

    req.providerProfile = providerProfile;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireApprovedProvider,
  APPROVED_PROVIDER_MESSAGE,
};
