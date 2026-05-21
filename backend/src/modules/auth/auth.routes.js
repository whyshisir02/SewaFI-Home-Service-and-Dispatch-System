const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('./auth.validation');
const { upload } = require('../../services/file.service');
const { authActionLimiter } = require('../../middlewares/rate-limit.middleware');

router.post('/send-otp', authActionLimiter, validate(sendOTPSchema), ctrl.sendRegisterOTP);
router.post('/resend-otp', authActionLimiter, validate(sendOTPSchema), ctrl.resendOTP);
router.post('/verify-otp', authActionLimiter, validate(verifyOTPSchema), ctrl.verifyOTP);
router.post('/register-customer', authActionLimiter, validate(registerSchema), ctrl.registerCustomer);
router.post('/register/customer', authActionLimiter, validate(registerSchema), ctrl.registerCustomer);
router.post(
  '/register-provider',
  authActionLimiter,
  upload.fields([
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
  ]),
  validate(registerSchema), // Add validation before controller
  ctrl.registerProvider
);
router.post(
  '/register/provider',
  authActionLimiter,
  upload.fields([
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
  ]),
  validate(registerSchema),
  ctrl.registerProvider
);
router.post('/login', authActionLimiter, validate(loginSchema), ctrl.login);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.post('/refresh-token', ctrl.refresh);
router.get('/me', authenticate, ctrl.me);
router.patch('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
