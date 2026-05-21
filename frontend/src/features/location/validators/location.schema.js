import { z } from 'zod';

export const locationSchema = z.object({
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  municipality: z.string().min(1, 'Municipality is required'),
  ward: z.string().min(1, 'Ward is required'),
  address: z.string().min(3, 'Address is required'),
  landmark: z.string().optional(),
});
