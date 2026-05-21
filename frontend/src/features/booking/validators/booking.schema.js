import { z } from 'zod';

export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  scheduledTime: z.string().min(1, 'Schedule is required'),
  address: z.string().min(3, 'Address is required'),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  municipality: z.string().min(1, 'Municipality is required'),
  ward: z.string().min(1, 'Ward is required'),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});
