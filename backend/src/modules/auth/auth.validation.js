const { body } = require('express-validator');

const sendOTPSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
];

const verifyOTPSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
];

const registerSchema = [
  body('name')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
  body('phone')
    .isLength({ min: 10 })
    .withMessage('Phone must be at least 10 digits')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['CUSTOMER', 'PROVIDER'])
    .withMessage('Invalid role'),
];

const loginSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
];

const resetPasswordSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email')
    .trim()
    .escape(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const changePasswordSchema = [
  body('currentPassword')
    .isLength({ min: 8 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

module.exports = {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
