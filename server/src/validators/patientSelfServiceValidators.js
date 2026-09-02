import { z } from 'zod';
import { dateString, uuid } from './commonValidators.js';

export const patientBookingSchema = z.object({ slotId: uuid, patientCardId: uuid.optional().nullable(), symptomAssessmentId: uuid.optional().nullable(), reasonForVisit: z.string().trim().min(3).max(1000), symptomsSummary: z.string().trim().max(2000).optional().nullable() }).strict();
export const cancellationSchema = z.object({ cancellationReason: z.string().trim().min(3).max(500).optional().nullable() }).strict();
export const rescheduleSchema = z.object({ newSlotId: uuid }).strict();
const bookableDate = dateString.refine((value) => value >= new Date().toISOString().slice(0, 10), 'Past dates are not available');
export const availabilitySchema = z.object({ date: bookableDate }).strict();
export const recommendationSchema = z.object({ hospitalId: uuid.optional(), departmentId: uuid, date: bookableDate }).strict();
export const patientProfileUpdateSchema = z.object({ phone: z.string().trim().min(7).max(30).optional(), address: z.string().trim().min(3).max(240).optional(), city: z.string().trim().min(2).max(100).optional(), region: z.string().trim().min(2).max(100).optional(), emergencyContactName: z.string().trim().min(2).max(160).optional().nullable(), emergencyContactPhone: z.string().trim().min(7).max(30).optional().nullable() }).strict().refine((data) => Object.keys(data).length > 0, 'At least one field is required');
