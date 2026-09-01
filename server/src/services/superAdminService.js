import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/password.js';
import { serializeUser } from '../utils/serializers.js';
import { auditService } from './auditService.js';

const adminSelect = {
  id: true, email: true, active: true, createdAt: true, lastLoginAt: true,
  adminProfile: { include: { hospital: { select: { id: true, name: true, hospitalCode: true, active: true } } } },
};

export const superAdminService = {
  hospitals: () => prisma.hospital.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, hospitalCode: true, city: true, region: true, active: true },
  }),

  admins: () => prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'desc' }, select: adminSelect }),

  async createAdmin(actor, data, request) {
    const [hospital, existing] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: data.hospitalId }, select: { id: true, active: true } }),
      prisma.user.findUnique({ where: { email: data.email } }),
    ]);
    if (!hospital?.active) throw new AppError('Hospital is unavailable', 400);
    if (existing) throw new AppError('An account with this email already exists', 409);
    const passwordHash = await hashPassword(data.password);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email, passwordHash, role: 'ADMIN',
          adminProfile: { create: { hospitalId: data.hospitalId, employeeNumber: data.employeeNumber, firstName: data.firstName, lastName: data.lastName, phone: data.phone } },
        },
        include: { adminProfile: { include: { hospital: true } } },
      });
      await auditService.record({ userId: actor.userId, hospitalId: data.hospitalId, action: 'HOSPITAL_ADMIN_CREATED', resourceType: 'User', resourceId: user.id, metadata: { role: 'ADMIN' }, request }, tx);
      return { user: serializeUser(user), profile: user.adminProfile };
    });
  },

  async setAdminActive(actor, userId, active, request) {
    const admin = await prisma.user.findFirst({ where: { id: userId, role: 'ADMIN' }, include: { adminProfile: true } });
    if (!admin) throw new AppError('Hospital administrator not found', 404);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data: { active }, select: adminSelect });
      if (!active) await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await auditService.record({ userId: actor.userId, hospitalId: admin.adminProfile?.hospitalId, action: active ? 'HOSPITAL_ADMIN_ACTIVATED' : 'HOSPITAL_ADMIN_DEACTIVATED', resourceType: 'User', resourceId: userId, request }, tx);
      return user;
    });
  },
};
