import { z } from 'zod';
import { dateString, timeString, uuid } from './commonValidators.js';

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

export const updateDepartmentScheduleSchema = z.object({ dayOfWeek: dayOfWeek.optional(), startTime: timeString.optional(), endTime: timeString.optional(), dailyCapacity: z.number().int().min(1).max(10000).optional(), active: z.boolean().optional() }).refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const updateDoctorScheduleSchema = z.object({ departmentId: uuid.optional(), dayOfWeek: dayOfWeek.optional(), startTime: timeString.optional(), endTime: timeString.optional(), consultationDurationMinutes: z.number().int().min(1).max(480).optional(), maximumPatients: z.number().int().min(1).max(1000).optional(), active: z.boolean().optional() }).refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const scheduleExceptionSchema = z.object({ date: dateString, exceptionType: z.enum(['UNAVAILABLE', 'LEAVE', 'CUSTOM_HOURS', 'HOLIDAY']), reason: z.string().trim().max(500).optional().nullable(), startTime: timeString.optional().nullable(), endTime: timeString.optional().nullable() }).superRefine((data, context) => {
  if (data.exceptionType === 'CUSTOM_HOURS' && (!data.startTime || !data.endTime)) context.addIssue({ code: 'custom', message: 'Custom hours require start and end times' });
  if (data.startTime && data.endTime && data.startTime >= data.endTime) context.addIssue({ code: 'custom', message: 'Start time must be before end time' });
});
export const slotDateQuerySchema = z.object({ date: dateString }).strict();
export const generateSlotsSchema = z.object({ departmentId: uuid, date: dateString }).strict();
