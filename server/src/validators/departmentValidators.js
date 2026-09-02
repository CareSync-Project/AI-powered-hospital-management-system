import { z } from 'zod';

const fields = {
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/).transform((value) => value.toUpperCase()),
  description: z.string().trim().max(1000).nullable().optional(),
  active: z.boolean(),
  requiresAppointment: z.boolean(),
};

export const createDepartmentSchema = z.object({
  ...fields,
  active: fields.active.optional().default(true),
  requiresAppointment: fields.requiresAppointment.optional().default(true),
});

export const updateDepartmentSchema = z.object(fields).partial().refine((data) => Object.keys(data).length > 0, 'At least one field is required');
