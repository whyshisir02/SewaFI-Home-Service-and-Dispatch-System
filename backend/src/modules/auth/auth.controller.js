const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const otpService = require('../../services/otp.service');
const emailService = require('../../services/email.service');
const { fileService } = require('../../services/file.service');
const { emitToRole } = require('../../config/socket');
const logger = require('../../config/logger');

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const runInBackground = (task, label = 'Background task failed') => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      logger.error(`${label}: ${error.message}`);
    });
};

const normalizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

const parseJsonArraySafe = (value, { fallback = [], field = 'field' } = {}) => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    logger.warn(`[registerProvider] Invalid JSON array for ${field}; using fallback. Reason: ${error.message}`);
    return fallback;
  }
};

const parseExpertise = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (value == null) return [];
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  const parsedArray = parseJsonArraySafe(trimmed, { fallback: null, field: 'expertise' });
  if (Array.isArray(parsedArray)) {
    return parsedArray.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const normalizeOtpPurpose = (purpose) => {
  const normalized = String(purpose || '').trim().toUpperCase();

  if (normalized === 'PASSWORD_RESET' || normalized === 'RESET_PASSWORD') {
    return 'password-reset';
  }

  return 'register';
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  avatar: true,
  province: true,
  district: true,
  municipality: true,
  ward: true,
  streetAddress: true,
  tempProvince: true,
  tempDistrict: true,
  tempMunicipality: true,
  tempWard: true,
  tempStreetAddress: true,
  providerProfile: {
    select: {
      id: true,
      categoryId: true,
      experienceYears: true,
      bio: true,
      expertise: true,
      availability: true,
      status: true,
      averageRating: true,
      totalReviews: true,
      totalJobs: true,
      isCurrentlyBusy: true,
      category: { select: { id: true, name: true, icon: true } },
      subCategories: {
        select: {
          subCategory: { select: { id: true, name: true } },
        },
      },
      serviceAreas: {
        select: { id: true, province: true, district: true, municipality: true },
      },
    },
  },
};

// Step 1: Send OTP
const sendRegisterOTP = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    throw new ApiError(400, 'Email required');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const otp = await otpService.sendOTP(email, 'register');
  await emailService.sendOTPEmail(email, otp);

  res.json(new ApiResponse(200, { email }, 'OTP sent. Verify to continue.'));
});

const resendOTP = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email || req.body.identifier);
  const purpose = normalizeOtpPurpose(req.body.purpose);

  if (!email) {
    throw new ApiError(400, 'Email required');
  }

  if (purpose === 'register') {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }
  }

  const otp = await otpService.sendOTP(email, purpose);

  if (purpose === 'password-reset') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await emailService.sendPasswordResetOTP(email, otp, user.name);
    }
  } else {
    await emailService.sendOTPEmail(email, otp);
  }

  res.json(new ApiResponse(200, { email, purpose }, 'OTP resent successfully'));
});

// Step 2: Verify OTP only (don't register yet)
const verifyOTP = asyncHandler(async (req, res) => {
  console.time('verifyOtp');
  const email = normalizeEmail(req.body.email);
  const { otp } = req.body;
  const purpose = normalizeOtpPurpose(req.body.purpose);
  logger.info(`[verifyOtp] request received for email=${email} purpose=${purpose}`);

  if (!email || !otp) {
    console.timeEnd('verifyOtp');
    throw new ApiError(400, 'Email and OTP required');
  }

  await otpService.verifyOTP(email, otp, purpose);
  logger.info('[verifyOtp] OTP verified');

  if (purpose === 'password-reset') {
    console.timeEnd('verifyOtp');
    return res.json(
      new ApiResponse(
        200,
        { email, purpose: 'PASSWORD_RESET' },
        'OTP verified for password reset.'
      )
    );
  }

  // Create a verification token valid for 30 minutes
  const verificationToken = await otpService.createVerificationToken(email);
  logger.info('[verifyOtp] verification token created');
  console.timeEnd('verifyOtp');

  res.json(
    new ApiResponse(
      200,
      { verificationToken, email },
      'OTP verified. Continue with registration.'
    )
  );
});

// Step 3: Complete customer registration
const registerCustomer = asyncHandler(async (req, res) => {
  const {
    verificationToken,
    name,
    phone,
    password,
    province,
    district,
    municipality,
    ward,
    streetAddress,
  } = req.body;

  const email = normalizeEmail(req.body.email);

  await otpService.verifyToken(email, verificationToken);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email or phone already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'CUSTOMER',
      isEmailVerified: true,
      province,
      district,
      municipality,
      ward,
      streetAddress,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  await otpService.deleteVerificationToken(email);

  res.status(201).json(new ApiResponse(201, user, 'Registered successfully'));
});

// Step 3b: Complete provider registration with KYC
const registerProvider = asyncHandler(async (req, res) => {
  console.time('registerProvider');
  const {
    verificationToken,
    name,
    phone,
    password,
    province,
    district,
    municipality,
    ward,
    streetAddress,
    categoryId,
    experienceYears,
    bio,
    expertise,
    citizenshipNumber,
    subCategoryIds,
    serviceAreas,
  } = req.body;

  const email = normalizeEmail(req.body.email);
  logger.info(`[registerProvider] request received for email=${email}`);

  await otpService.verifyToken(email, verificationToken);
  logger.info('[registerProvider] verification token validated');

  if (!req.files?.citizenshipFront || !req.files?.citizenshipBack) {
    throw new ApiError(400, 'Both citizenship images required');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, 'Email or phone already registered');
  }

  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Upload files
  const [front, back] = await Promise.all([
    fileService.uploadToCloudinary(
      req.files.citizenshipFront[0],
      `kyc/${email}`
    ),
    fileService.uploadToCloudinary(
      req.files.citizenshipBack[0],
      `kyc/${email}`
    ),
  ]);
  logger.info('[registerProvider] KYC uploads completed');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Parse optional arrays safely (never throw on empty/malformed values)
  const subIds = parseJsonArraySafe(subCategoryIds, { fallback: [], field: 'subCategoryIds' })
    .map((id) => String(id || '').trim())
    .filter(Boolean);

  const areas = parseJsonArraySafe(serviceAreas, { fallback: [], field: 'serviceAreas' })
    .filter((area) => area && typeof area === 'object');

  const expertiseArr = parseExpertise(expertise);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'PROVIDER',
        isActive: true,
        isEmailVerified: true,
        province,
        district,
        municipality,
        ward,
        streetAddress,
      },
    });

    const profile = await tx.providerProfile.create({
      data: {
        userId: user.id,
        categoryId,
        experienceYears: parseInt(experienceYears, 10) || 0,
        bio,
        expertise: expertiseArr,
        citizenshipNumber,
        citizenshipFront: front.secure_url,
        citizenshipFrontPublicId: front.public_id,
        citizenshipBack: back.secure_url,
        citizenshipBackPublicId: back.public_id,
        status: 'PENDING_APPROVAL',
        subCategories: {
          create: subIds.map((id) => ({
            subCategoryId: id,
          })),
        },
        serviceAreas: {
          create: areas.map((area) => ({
            province: area.province,
            district: area.district,
            municipality: area.municipality || null,
          })),
        },
      },
    });

    return { user, profile };
  });

  await otpService.deleteVerificationToken(email);
  logger.info('[registerProvider] verification token deleted');

  // Notify admins
  const notificationService = require('../../services/notification.service');

  runInBackground(
  async () => {
    await notificationService.notifyAdminNewProvider(result.user.name, category.name);

    emitToRole('ADMIN', 'provider:newApplication', {
      providerId: result.user.id,
      name: result.user.name,
      category: category.name,
    });
  },
  `[registerProvider] Admin notification failed for ${email}`
);

  logger.info(`Provider application: ${email}`);
  console.timeEnd('registerProvider');

  res.status(201).json(
    new ApiResponse(
      201,
      { id: result.user.id },
      'Application submitted. Wait for admin approval.'
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...userSelect,
      password: true,
      providerProfile: {
        select: {
          ...userSelect.providerProfile.select,
          rejectionReason: true,
        },
      },
    },
  });

  if (!user) {
    logger.warn(`Failed login attempt: Invalid email - ${email} from IP: ${req.ip}`);
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    logger.warn(`Failed login attempt: Invalid password for ${email} from IP: ${req.ip}`);
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
  throw new ApiError(403, 'Account disabled');
}

// if (user.role === 'PROVIDER' && user.providerProfile?.status === 'SUSPENDED') {
//   throw new ApiError(403, 'Provider account suspended');
// }

// if (user.role === 'PROVIDER' && user.providerProfile?.status === 'REJECTED') {
//   throw new ApiError(
//     403,
//     `Provider application rejected: ${user.providerProfile.rejectionReason || 'Not specified'}`
//   );
// }

//only suspended provider cannot login
if (user.role === 'PROVIDER' && user.providerProfile?.status === 'SUSPENDED') {
  throw new ApiError(403, 'Provider account suspended');
}

  logger.info(`Successful login: ${email} from IP: ${req.ip}`);

  const payload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { password: _, ...safeUser } = user;

  if (safeUser.role === 'PROVIDER') {
    safeUser.providerStatus = safeUser.providerProfile?.status || null;
  }

res
  .cookie('accessToken', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: safeUser, accessToken, refreshToken },
        'Login successful'
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.json(new ApiResponse(200, {}, 'If email exists, OTP sent'));
  }

  const otp = await otpService.sendOTP(email, 'password-reset');
  await emailService.sendPasswordResetOTP(email, otp, user.name);

  res.json(new ApiResponse(200, {}, 'OTP sent'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await otpService.verifyOTP(email, otp, 'password-reset');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  res.json(new ApiResponse(200, {}, 'Password reset successful'));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Unable to change password with the provided credentials');
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await prisma.refreshToken.deleteMany({
    where: { userId: req.user.id },
  });

  res
    .clearCookie('accessToken', baseCookieOptions)
    .clearCookie('refreshToken', baseCookieOptions)
    .json(new ApiResponse(200, null, 'Password changed successfully'));
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  res
    .clearCookie('accessToken', baseCookieOptions)
    .clearCookie('refreshToken', baseCookieOptions)
    .json(new ApiResponse(200, null, 'Logged out'));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Refresh token expired');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    select: {
      userId: true,
      expiresAt: true,
    },
  });

  if (
    !storedToken ||
    storedToken.userId !== decoded.id ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: userSelect,
  });

  if (!user || !user.isActive) {
  throw new ApiError(401, 'User inactive or missing');
}

const responseUser = {
  ...user,
  providerStatus:
    user.role === 'PROVIDER' ? user.providerProfile?.status || null : null,
};

const accessToken = signAccessToken({
  id: user.id,
  role: user.role,
});

res
  .cookie('accessToken', accessToken, accessCookieOptions)
  .json(new ApiResponse(200, { user: responseUser }, 'Session refreshed'));
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const responseUser = {
    ...user,
    providerStatus:
      user.role === 'PROVIDER' ? user.providerProfile?.status || null : null,
  };

  res.json(new ApiResponse(200, responseUser, 'Current user'));
});

module.exports = {
  sendRegisterOTP,
  resendOTP,
  verifyOTP,
  registerCustomer,
  registerProvider,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  refresh,
  me,
}
