const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

if (!env.RESEND?.API_KEY) {
  throw new Error('RESEND_API_KEY is missing');
}

const resend = new Resend(env.RESEND.API_KEY);

const getFromAddress = () => {
  const fromName = env.EMAIL?.FROM_NAME || 'SewaFi';
  const fromAddress = env.EMAIL?.FROM_ADDRESS || 'otp@shisiruparkoti.com.np';

  return `${fromName} <${fromAddress}>`;
};

const withTimeout = async (promise, ms = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email request timeout')), ms)
    ),
  ]);
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new ApiError(400, 'Email recipient is required');
  }

  try {
    const { data, error } = await withTimeout(
      resend.emails.send({
        from: getFromAddress(),
        to,
        subject,
        html,
        text,
      }),
      10000
    );

    if (error) {
      logger.error(`Resend error: ${error.message || JSON.stringify(error)}`);
      throw new Error('Resend email failed');
    }

    logger.info(`Email sent to ${to}: ${subject}`);
    return data;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw new ApiError(
      503,
      'Email service is temporarily unavailable. Please try again.'
    );
  }
};

const createOtpEmail = ({ otp, purpose = 'verify your email' }) => {
  const expiryMinutes = env.OTP?.EXPIRY_MINUTES || 5;

  return {
    subject: '🔐 SewaFi - Verify Your Email',
    text: `
Your SewaFi OTP is: ${otp}

Use this code to ${purpose}.
This OTP is valid for ${expiryMinutes} minutes.

Never share this OTP with anyone.
`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">SewaFi 🏠</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827;">Verify Your Email</h2>

          <p style="color: #374151;">Your One-Time Password is:</p>

          <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>

          <p style="color: #666;">This OTP is valid for ${expiryMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px;">Never share this OTP with anyone.</p>
        </div>
      </div>
    `,
  };
};

const createPasswordResetEmail = ({ otp, userName = 'User' }) => {
  const expiryMinutes = env.OTP?.EXPIRY_MINUTES || 5;

  return {
    subject: '🔑 SewaFi - Reset Your Password',
    text: `
Hi ${userName},

Your password reset OTP is: ${otp}

This OTP is valid for ${expiryMinutes} minutes.
If you did not request this, ignore this email.
`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">SewaFi 🏠</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Use this OTP to reset your password:</p>

          <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>

          <p style="color: #666;">This OTP is valid for ${expiryMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  };
};

const emailService = {
  sendEmail,

  // Active: registration OTP only
  sendOTPEmail: async (email, otp) => {
    const template = createOtpEmail({
      otp,
      purpose: 'verify your SewaFi account',
    });

    return sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  },

  // Active: password reset OTP only
  sendPasswordResetOTP: async (email, otp, userName) => {
    const template = createPasswordResetEmail({
      otp,
      userName,
    });

    return sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  },

  // Disabled intentionally: use in-app notification instead
  sendBookingConfirmation: async () => {
    logger.info('Booking confirmation email skipped. Email is disabled for booking events.');
    return { skipped: true };
  },

  // Disabled intentionally: use in-app notification instead
  sendProviderAssigned: async () => {
    logger.info('Provider assigned email skipped. Email is disabled for booking events.');
    return { skipped: true };
  },
};

module.exports = emailService;