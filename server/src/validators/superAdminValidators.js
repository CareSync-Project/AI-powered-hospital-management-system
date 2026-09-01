import { z } from 'zod';
import { passwordSchema } from './authValidators.js';
import { uuid } from './commonValidators.js';

export const createHospitalAdminSchema = z.object({
  hospitalId: uuid,
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  employeeNumber: z.string().trim().min(2).max(50),
}).strict();

export const updateHospitalAdminSchema = z.object({ active: z.boolean() }).strict();
