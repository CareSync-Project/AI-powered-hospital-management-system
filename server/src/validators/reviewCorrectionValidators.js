import { z } from 'zod';
import { uuid } from './commonValidators.js';
import { passwordSchema } from './authValidators.js';

export const nurseDepartmentSchema = z.object({ departmentId: uuid, active: z.boolean().optional().default(true) }).strict();
export const nurseAppointmentSchema = z.object({ nurseId: uuid, active: z.boolean().optional().default(true) }).strict();
export const reportQuerySchema = z.object({
  from: z.iso.date().optional(), to: z.iso.date().optional(), departmentId: uuid.optional(), doctorId: uuid.optional(), nurseId: uuid.optional(),
  status: z.enum(['PENDING','CONFIRMED','CHECKED_IN','TRIAGED','WAITING','IN_CONSULTATION','COMPLETED','CANCELLED','MISSED']).optional(),
}).strict();
export const bulkStaffSchema = z.object({ rows: z.array(z.object({
  firstName: z.string().trim().min(2).max(80), lastName: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().min(7).max(30),
  employeeNumber: z.string().trim().min(2).max(50), role: z.enum(['DOCTOR','NURSE']), department: z.string().trim().min(2).max(120), specialization: z.string().trim().max(120).optional().default(''), qualification: z.string().trim().max(160).optional().default(''), licenseNumber: z.string().trim().min(2).max(80), initialPassword: passwordSchema,
}).strict()).min(1).max(500) }).strict();
