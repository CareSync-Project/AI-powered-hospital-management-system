import { z } from 'zod';
import { timeString, uuid } from './commonValidators.js';

const dayOfWeek = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);

export const departmentScheduleSchema = z.object({
  hospitalId: uuid,
  departmentId: uuid,
  dayOfWeek,
  startTime: timeString,
  endTime: timeString,
  dailyCapacity: z.number().int().min(1).max(10000),
  active: z.boolean().optional().default(true),
});

export const doctorScheduleSchema = z.object({
  doctorId: uuid,
  hospitalId: uuid,
  departmentId: uuid,
  dayOfWeek,
  startTime: timeString,
  endTime: timeString,
  consultationDurationMinutes: z.number().int().min(1).max(480),
  maximumPatients: z.number().int().min(1).max(1000),
  active: z.boolean().optional().default(true),
});
