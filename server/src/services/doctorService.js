import { doctorRepository } from '../repositories/doctorRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/prisma.js';

export async function validateDoctorDepartmentContext(doctorId, departmentId, hospitalId, repositories = { doctorRepository, departmentRepository }, client) {
  const [affiliation, assignment, department] = await Promise.all([
    repositories.doctorRepository.findAffiliation(doctorId, hospitalId, client),
    repositories.doctorRepository.findDepartmentAssignment(doctorId, departmentId, hospitalId, client),
    repositories.departmentRepository.findById(departmentId, client),
  ]);

  if (!department || department.hospitalId !== hospitalId) throw new AppError('Department does not belong to the hospital', 400);
  if (!affiliation?.active) throw new AppError('Doctor is not actively affiliated with the hospital', 400);
  if (!assignment?.active) throw new AppError('Doctor is not actively assigned to the department', 400);
  return { affiliation, assignment, department };
}

export const doctorService = {
  listByHospital: (hospitalId) => doctorRepository.findPublicByHospital(hospitalId),
  async get(id) {
    const doctor = await doctorRepository.findPublicById(id);
    if (!doctor) throw new AppError('Doctor not found', 404);
    return doctor;
  },
  createAffiliation: (data) => doctorRepository.createAffiliation(data),
  async assignDepartment(data) {
    const department = await departmentRepository.findById(data.departmentId);
    const affiliation = await doctorRepository.findAffiliation(data.doctorId, data.hospitalId);
    if (!department || department.hospitalId !== data.hospitalId) throw new AppError('Department does not belong to the hospital', 400);
    if (!affiliation?.active) throw new AppError('Doctor must have an active hospital affiliation', 400);
    const existing = await doctorRepository.findDepartmentAssignment(data.doctorId, data.departmentId, data.hospitalId);
    if (existing?.active) throw new AppError('Doctor is already assigned to this department', 409);
    return prisma.$transaction(async (tx) => {
      if (data.primaryDepartment) await tx.doctorDepartment.updateMany({ where: { doctorId: data.doctorId, hospitalId: data.hospitalId, primaryDepartment: true, active: true }, data: { primaryDepartment: false } });
      return tx.doctorDepartment.upsert({ where: { doctorId_departmentId_hospitalId: { doctorId: data.doctorId, departmentId: data.departmentId, hospitalId: data.hospitalId } }, update: { active: true, primaryDepartment: data.primaryDepartment }, create: data, include: { department: true } });
    });
  },
  async listForAdmin(hospitalId) { return doctorRepository.findByHospital(hospitalId); },
  async updateForHospital(doctorId, hospitalId, data) {
    const affiliation = await doctorRepository.findAffiliation(doctorId, hospitalId);
    if (!affiliation) throw new AppError('Doctor does not belong to this hospital', 403);
    return prisma.$transaction(async (tx) => {
      const profile = await tx.doctorProfile.update({ where: { id: doctorId }, data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, specialization: data.specialization, qualification: data.qualification, active: data.active } });
      if (data.active !== undefined) await tx.doctorHospital.update({ where: { doctorId_hospitalId: { doctorId, hospitalId } }, data: { active: data.active, ...(data.active ? { endedAt: null } : { endedAt: new Date() }) } });
      return profile;
    });
  },
  async deactivateAssignment(doctorId, departmentId, hospitalId) {
    const assignment = await doctorRepository.findDepartmentAssignment(doctorId, departmentId, hospitalId);
    if (!assignment) throw new AppError('Doctor department assignment not found', 404);
    return prisma.doctorDepartment.update({ where: { doctorId_departmentId_hospitalId: { doctorId, departmentId, hospitalId } }, data: { active: false, primaryDepartment: false } });
  },
};
