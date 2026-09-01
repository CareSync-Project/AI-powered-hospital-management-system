import prisma from '../config/prisma.js';

export const authContextInclude = {
  adminProfile: true,
  patientProfile: { include: { hospitalRecords: true } },
  doctorProfile: { include: { hospitalAffiliations: true, departments: true } },
  nurseProfile: true,
};

export const authRepository = {
  findUserByEmail: (email, client = prisma) => client.user.findUnique({ where: { email }, include: authContextInclude }),
  findUserById: (id, client = prisma) => client.user.findUnique({ where: { id }, include: authContextInclude }),
  findSessionByHash: (refreshTokenHash, client = prisma) => client.authSession.findUnique({ where: { refreshTokenHash }, include: { user: { include: authContextInclude } } }),
  findSessionById: (id, client = prisma) => client.authSession.findUnique({ where: { id }, include: { user: { include: authContextInclude } } }),
  createSession: (data, client = prisma) => client.authSession.create({ data }),
  rotateSession: (id, data, client = prisma) => client.authSession.update({ where: { id }, data }),
  revokeSession: (id, client = prisma) => client.authSession.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } }),
  revokeUserSessions: (userId, exceptSessionId, client = prisma) => client.authSession.updateMany({ where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) }, data: { revokedAt: new Date() } }),
  deleteExpiredAndOldRevoked: (before, client = prisma) => client.authSession.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: before } }] } }),
};
