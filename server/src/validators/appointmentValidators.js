import { z } from 'zod';
import { dateString, timeString, uuid } from './commonValidators.js';

export const createAppointmentSchema = z.object({
  patientId: uuid.optional(),
  hospitalId: uuid,
  departmentId: uuid,
  doctorId: uuid,
  patientCardId: uuid.optional().nullable(),
  appointmentSlotId: uuid.optional().nullable(),
  appointmentDate: dateString,
  startTime: timeString,
  endTime: timeString,
  reasonForVisit: z.string().trim().min(3).max(1000),
  symptomsSummary: z.string().trim().max(2000).optional().nullable(),
  urgency: z.enum(['ROUTINE', 'LOW', 'MODERATE', 'HIGH', 'EMERGENCY']).optional().default('ROUTINE'),
  bookingMethod: z.enum(['PATIENT_PWA', 'STAFF', 'WALK_IN', 'AI_RECOMMENDATION']),
});

export const appointmentQuerySchema = z.object({
  patientId: uuid.optional(),
  doctorId: uuid.optional(),
  hospitalId: uuid.optional(),
  departmentId: uuid.optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'TRIAGED', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'MISSED']).optional(),
}).strict();
