import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditService } from './auditService.js';
import { getAdminHospitalId } from './authorizationService.js';
import { hashPassword } from '../utils/password.js';
import { serializeUser } from '../utils/serializers.js';
import { emailService } from './emailService.js';

async function ensureAvailableEmail(email) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists', 409);
}

async function adminHospital(auth) {
  const hospitalId = getAdminHospitalId(auth);
  const hospital = hospitalId && await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true, active: true } });
  if (!hospital?.active) throw new AppError('Administrator hospital is unavailable', 403);
  return hospital;
}

export const staffAccountService = {
  async createDoctor(auth, data, request) {
    const hospital = await adminHospital(auth);
    const hospitalId = hospital.id;
    await ensureAvailableEmail(data.email);
    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId }, select: { hospitalId: true, active: true } });
      if (!department?.active || department.hospitalId !== hospitalId) throw new AppError('Department does not belong to your hospital', 403);
    }
    const passwordHash = await hashPassword(data.password);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: data.email, passwordHash, role: 'DOCTOR', doctorProfile: { create: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, employeeNumber: data.employeeNumber, licenseNumber: data.licenseNumber, specialization: data.specialization, qualification: data.qualification, hospitalAffiliations: { create: { hospitalId, employeeNumber: data.employeeNumber, startedAt: new Date(`${data.startedAt}T00:00:00.000Z`) } }, ...(data.departmentId ? { departments: { create: { hospitalId, departmentId: data.departmentId, primaryDepartment: data.primaryDepartment } } } : {}) } } }, include: { doctorProfile: { include: { hospitalAffiliations: true, departments: true } } } });
      await auditService.record({ userId: auth.user.id, hospitalId, action: 'DOCTOR_CREATED', resourceType: 'User', resourceId: user.id, metadata: { role: 'DOCTOR' }, request }, tx);
      return { user: serializeUser(user), profile: user.doctorProfile };
    });

    // Send email with login credentials asynchronously
    emailService.sendStaffCredentials({
      to: data.email,
      name: `Dr. ${data.firstName} ${data.lastName}`,
      role: 'Doctor',
      password: data.password,
      hospitalName: hospital.name,
    }).catch(err => console.error('[staffAccountService] Welcome email error:', err.message));

    return result;
  },

  async createNurse(auth, data, request) {
    const hospital = await adminHospital(auth);
    const hospitalId = hospital.id;
    await ensureAvailableEmail(data.email);
    const passwordHash = await hashPassword(data.password);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: data.email, passwordHash, role: 'NURSE', nurseProfile: { create: { hospitalId, employeeNumber: data.employeeNumber, firstName: data.firstName, lastName: data.lastName, phone: data.phone, licenseNumber: data.licenseNumber } } }, include: { nurseProfile: true } });
      await auditService.record({ userId: auth.user.id, hospitalId, action: 'STAFF_ACCOUNT_CREATED', resourceType: 'User', resourceId: user.id, metadata: { role: 'NURSE' }, request }, tx);
      return { user: serializeUser(user), profile: user.nurseProfile };
    });

    // Send email with login credentials asynchronously
    emailService.sendStaffCredentials({
      to: data.email,
      name: `Nurse ${data.firstName} ${data.lastName}`,
      role: 'Nurse',
      password: data.password,
      hospitalName: hospital.name,
    }).catch(err => console.error('[staffAccountService] Welcome email error:', err.message));

    return result;
  },
};
