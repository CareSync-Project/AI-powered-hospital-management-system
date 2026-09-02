import { z } from 'zod';
import { dateString, uuid } from './commonValidators.js';

export const createPatientCardSchema = z.object({
  hospitalId: uuid.optional(),
  cardType: z.enum(['HOSPITAL_CARD', 'NHIS_CARD']),
  cardNumber: z.string().trim().min(4).max(80),
  expiresAt: dateString.optional().nullable(),
});

export const verifyPatientCardSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
  verifiedByAdminId: uuid.optional(),
  rejectionReason: z.string().trim().min(3).max(500).optional().nullable(),
}).superRefine((data, context) => {
  if (data.verificationStatus === 'REJECTED' && !data.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'A rejection reason is required' });
  }
});
