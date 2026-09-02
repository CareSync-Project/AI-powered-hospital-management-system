import { z } from 'zod';
import { uuid } from './commonValidators.js';

const optionalMeasurement = (maximum) => z.number().positive().max(maximum).optional().nullable();

export const createVitalSchema = z.object({
  appointmentId: uuid.optional().nullable(),
  hospitalId: uuid,
  temperature: optionalMeasurement(60),
  systolicBP: z.number().int().positive().max(350).optional().nullable(),
  diastolicBP: z.number().int().positive().max(250).optional().nullable(),
  heartRate: z.number().int().positive().max(350).optional().nullable(),
  oxygenSaturation: optionalMeasurement(100),
  respiratoryRate: z.number().int().positive().max(150).optional().nullable(),
  weight: optionalMeasurement(800),
  height: optionalMeasurement(300),
  bloodGlucose: optionalMeasurement(1000),
  source: z.enum(['PATIENT', 'NURSE', 'DOCTOR', 'CONNECTED_DEVICE']),
  verificationStatus: z.enum(['UNVERIFIED', 'VERIFIED']).optional(),
  recordedByUserId: uuid,
  recordedAt: z.coerce.date().optional(),
});
