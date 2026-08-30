import { z } from 'zod';
import {
  FULL_NAME_REGEX,
  NEPAL_MOBILE_LOCAL_REGEX,
  normalizeFullName,
  REGISTER_VALIDATION_MESSAGES,
} from '../utils/registerValidation';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email address is required.')
  .email('Please enter a valid email address.');

const passwordSchema = z
  .string()
  .min(1, 'Password is required.')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
    'Use 8+ chars with uppercase, lowercase, number, and special character.'
  );

const addressSchema = {
  province: z.string().min(1, 'Province is required.'),
  district: z.string().min(1, 'District is required.'),
  municipality: z.string().min(1, 'Municipality is required.'),
  ward: z.string().trim().min(1, 'Ward is required.'),
  streetAddress: z.string().trim().min(1, 'Address is required.'),
};

export const customerRegisterSchema = z.object({
  name: z
    .string()
    .transform((value) => normalizeFullName(value))
    .refine((value) => value.length > 0, REGISTER_VALIDATION_MESSAGES.fullNameRequired)
    .refine((value) => FULL_NAME_REGEX.test(value), REGISTER_VALIDATION_MESSAGES.fullNameInvalid),
  email: emailSchema,
  phone: z
    .string()
    .min(1, REGISTER_VALIDATION_MESSAGES.phoneRequired)
    .regex(NEPAL_MOBILE_LOCAL_REGEX, REGISTER_VALIDATION_MESSAGES.phoneInvalid),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
  ...addressSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export const providerAccountSchema = z.object({
  name: z
    .string()
    .transform((value) => normalizeFullName(value))
    .refine((value) => value.length > 0, REGISTER_VALIDATION_MESSAGES.fullNameRequired)
    .refine((value) => FULL_NAME_REGEX.test(value), REGISTER_VALIDATION_MESSAGES.fullNameInvalid),
  email: emailSchema,
  phone: z
    .string()
    .min(1, REGISTER_VALIDATION_MESSAGES.phoneRequired)
    .regex(NEPAL_MOBILE_LOCAL_REGEX, REGISTER_VALIDATION_MESSAGES.phoneInvalid),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export const providerServiceSchema = z.object({
  categoryId: z.string().min(1, 'Service category is required.'),
  serviceIds: z.array(z.string()).min(1, 'Select at least one service you provide.'),
  experienceYears: z.coerce.number({ invalid_type_error: 'Experience is required.' }).min(0, 'Experience cannot be negative.'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
});

export const providerAddressVerificationSchema = z.object({
  ...addressSchema,
  citizenshipNumber: z.string().trim().min(1, 'Citizenship number is required.'),
});
