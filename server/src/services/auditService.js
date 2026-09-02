import prisma from '../config/prisma.js';

const FORBIDDEN_KEYS = new Set(['password', 'passwordHash', 'refreshToken', 'refreshTokenHash', 'cardNumber', 'symptomsSummary', 'consultationNotes']);

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !FORBIDDEN_KEYS.has(key))
    .map(([key, item]) => [key, sanitizeMetadata(item)]));
}

export const auditService = {
  record({ userId, hospitalId, action, resourceType, resourceId, metadata, request }, client = prisma) {
    if (!userId) return Promise.resolve(null);
    return client.auditLog.create({ data: {
      userId,
      hospitalId: hospitalId || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      metadata: metadata ? sanitizeMetadata(metadata) : undefined,
      ipAddress: request?.ip || null,
      userAgent: request?.get?.('user-agent')?.slice(0, 500) || null,
    } });
  },
};
