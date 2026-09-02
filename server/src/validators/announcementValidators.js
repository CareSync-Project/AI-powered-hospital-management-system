import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
  audience: z.enum(['ALL', 'PATIENTS', 'DOCTORS', 'NURSES', 'STAFF']),
});
