import { patientRepository } from '../repositories/patientRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const patientService = {
  async get(id) {
    const patient = await patientRepository.findById(id);
    if (!patient) throw new AppError('Patient not found', 404);
    return patient;
  },
  update: (id, data) => patientRepository.update(id, data),
};
