import { z } from 'zod';

export const uuid = z.string().uuid();
export const idParamsSchema = z.object({ id: uuid });
export const hospitalParamsSchema = z.object({ hospitalId: uuid });
export const departmentParamsSchema = z.object({ departmentId: uuid });
export const doctorParamsSchema = z.object({ doctorId: uuid });
export const patientParamsSchema = z.object({ patientId: uuid });
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm in 24-hour format');
export const dateString = z.string().date();
