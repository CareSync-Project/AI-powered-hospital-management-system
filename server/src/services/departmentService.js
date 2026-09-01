import { departmentRepository } from '../repositories/departmentRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export async function assertHospitalExists(hospitalId, repositories = { hospitalRepository }) {
  const hospital = await repositories.hospitalRepository.findById(hospitalId);
  if (!hospital) throw new AppError('Hospital not found', 404);
  return hospital;
}

export const departmentService = {
  listByHospital: (hospitalId) => departmentRepository.findByHospital(hospitalId),
  async get(id) {
    const department = await departmentRepository.findById(id);
    if (!department) throw new AppError('Department not found', 404);
    return department;
  },
  async create(hospitalId, data) {
    await assertHospitalExists(hospitalId);
    return departmentRepository.create({ ...data, hospitalId });
  },
  async update(id, data) {
    await this.get(id);
    return departmentRepository.update(id, data);
  },
};
