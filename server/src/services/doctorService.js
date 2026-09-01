import { doctorRepository } from '../repositories/doctorRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { AppError } from '../middleware/errorHandler.js';

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
    return doctorRepository.createDepartmentAssignment(data);
  },
};
