import { z } from 'zod';

const password = z.string().min(10, 'Password must contain at least 10 characters').max(128)
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/\d/, 'Password must include a number');

export const registerPatientSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password,
  confirmPassword: z.string(),
  role: z.literal('PATIENT').optional(),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  otherNames: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().min(7).max(30),
  dateOfBirth: z.string().date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
}).strict().refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) }).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
  confirmPassword: z.string(),
}).strict().refine((data) => data.newPassword === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export { password as passwordSchema };
