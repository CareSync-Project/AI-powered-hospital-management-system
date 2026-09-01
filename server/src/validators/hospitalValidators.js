import { z } from 'zod';

const hospitalFields = {
  name: z.string().trim().min(2).max(160),
  hospitalCode: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/).transform((value) => value.toUpperCase()),
  address: z.string().trim().min(3).max(240),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().toLowerCase().email(),
  active: z.boolean(),
};

export const createHospitalSchema = z.object({
  ...hospitalFields,
  active: hospitalFields.active.optional().default(true),
});

export const updateHospitalSchema = z.object(hospitalFields).partial().refine((data) => Object.keys(data).length > 0, 'At least one field is required');
