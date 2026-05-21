import { z } from 'zod';

export const reviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  providerId: z.string().optional().nullable(),
  rating: z.coerce.number().int('Rating must be a whole number').min(1).max(5),
  comment: z.string().trim().max(500, 'Comment should be less than 500 characters').optional().or(z.literal('')),
});
