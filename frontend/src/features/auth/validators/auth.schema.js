import { z } from 'zod';
import {
  FULL_NAME_REGEX,
  NEPAL_MOBILE_LOCAL_REGEX,
  normalizeFullName,
  REGISTER_VALIDATION_MESSAGES,
} from '../utils/registerValidation';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, REGISTER_VALIDATION_MESSAGES.fullNameRequired)
    .transform((value) => normalizeFullName(value))
    .refine((value) => FULL_NAME_REGEX.test(value), REGISTER_VALIDATION_MESSAGES.fullNameInvalid),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .min(1, REGISTER_VALIDATION_MESSAGES.phoneRequired)
    .regex(NEPAL_MOBILE_LOCAL_REGEX, REGISTER_VALIDATION_MESSAGES.phoneInvalid),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  municipality: z.string().min(1, 'Municipality is required'),
  ward: z.string().min(1, 'Ward is required'),
  streetAddress: z.string().min(2, 'Street address is required'),
  categoryId: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  citizenshipNumber: z.string().optional(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6, 'Enter the 6-digit OTP'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(6, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
