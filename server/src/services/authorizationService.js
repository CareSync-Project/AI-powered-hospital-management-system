import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAdminHospitalId = (auth) => auth.user.adminProfile?.hospitalId || null;
export const getNurseHospitalId = (auth) => auth.user.nurseProfile?.hospitalId || null;
export const getPatientProfileId = (auth) => auth.user.patientProfile?.id || null;
export const getDoctorProfileId = (auth) => auth.user.doctorProfile?.id || null;

export function requireMatchingHospital(auth, hospitalId) {
  const authorized = auth.role === 'ADMIN' ? getAdminHospitalId(auth) === hospitalId
    : auth.role === 'NURSE' ? getNurseHospitalId(auth) === hospitalId
      : auth.role === 'DOCTOR' ? auth.user.doctorProfile?.hospitalAffiliations.some((item) => item.hospitalId === hospitalId && item.active)
        : false;
  if (!authorized) throw new AppError('Not authorized for this hospital', 403);
}

export async function requireDepartmentHospital(auth, departmentId) {
  const department = await prisma.department.findUnique({ where: { id: departmentId }, select: { hospitalId: true } });
  if (!department) throw new AppError('Department not found', 404);
  requireMatchingHospital(auth, department.hospitalId);
  return department.hospitalId;
}

export async function requirePatientAccess(auth, patientId) {
  if (auth.role === 'PATIENT') {
    if (getPatientProfileId(auth) !== patientId) throw new AppError('Not authorized', 403);
    return;
  }
  if (auth.role === 'DOCTOR') {
    const count = await prisma.appointment.count({ where: { patientId, doctorId: getDoctorProfileId(auth), status: { notIn: ['CANCELLED', 'MISSED'] } } });
    if (!count) throw new AppError('No active care relationship', 403);
    return;
  }
  const hospitalId = auth.role === 'ADMIN' ? getAdminHospitalId(auth) : getNurseHospitalId(auth);
  if (!hospitalId) throw new AppError('Not authorized', 403);
  const count = await prisma.patientHospitalRecord.count({ where: { patientId, hospitalId, status: 'ACTIVE' } });
  if (!count) throw new AppError('Patient is not registered with your hospital', 403);
}

export function appointmentFiltersForAuth(auth) {
  if (auth.role === 'PATIENT') return { patientId: getPatientProfileId(auth) };
  if (auth.role === 'DOCTOR') return { doctorId: getDoctorProfileId(auth) };
  if (auth.role === 'ADMIN') return { hospitalId: getAdminHospitalId(auth) };
  if (auth.role === 'NURSE') return { hospitalId: getNurseHospitalId(auth) };
  throw new AppError('Not authorized', 403);
}

export async function requireAppointmentAccess(auth, appointmentId) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, select: { id: true, patientId: true, doctorId: true, hospitalId: true } });
  if (!appointment) throw new AppError('Appointment not found', 404);
  const allowed = (auth.role === 'PATIENT' && appointment.patientId === getPatientProfileId(auth))
    || (auth.role === 'DOCTOR' && appointment.doctorId === getDoctorProfileId(auth))
    || (auth.role === 'ADMIN' && appointment.hospitalId === getAdminHospitalId(auth))
    || (auth.role === 'NURSE' && appointment.hospitalId === getNurseHospitalId(auth));
  if (!allowed) throw new AppError('Not authorized', 403);
  return appointment;
}
