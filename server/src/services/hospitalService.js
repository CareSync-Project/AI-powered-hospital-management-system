import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const hospitalService = {
  list: () => hospitalRepository.findPublic(),
  async getPublic(id) {
    const [hospital] = await hospitalRepository.findPublic({ id });
    if (!hospital) throw new AppError('Hospital not found', 404);
    return hospital;
  },
  async getManagement(id) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) throw new AppError('Hospital not found', 404);
    return hospital;
  },
  async get(id) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) throw new AppError('Hospital not found', 404);
    return hospital;
  },
  create: (data) => hospitalRepository.create(data),
  async update(id, data) {
    await this.get(id);
    return hospitalRepository.update(id, data);
  },
};
