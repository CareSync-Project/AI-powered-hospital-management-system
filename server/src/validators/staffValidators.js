import { z } from 'zod';
import { passwordSchema } from './authValidators.js';
import { dateString, uuid } from './commonValidators.js';

const common = {
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  employeeNumber: z.string().trim().min(2).max(50),
  licenseNumber: z.string().trim().min(2).max(80),
};

export const createDoctorAccountSchema = z.object({
  ...common,
  specialization: z.string().trim().min(2).max(120),
  qualification: z.string().trim().min(2).max(160),
  startedAt: dateString,
  departmentId: uuid.optional(),
  primaryDepartment: z.boolean().optional().default(false),
}).strict();

export const createNurseAccountSchema = z.object(common).strict();
