import { hospitalService } from '../services/hospitalService.js';
import { auditService } from '../services/auditService.js';
import { AppError } from '../middleware/errorHandler.js';

export const hospitalController = {
  async list(_request, response) { response.json({ success: true, data: await hospitalService.list() }); },
  async get(request, response) { response.json({ success: true, data: await hospitalService.getPublic(request.params.id) }); },
  async create() { throw new AppError('Hospital creation requires system provisioning', 403); },
  async update(request, response) { const data = await hospitalService.update(request.params.id, request.body); await auditService.record({ userId: request.auth.userId, hospitalId: request.params.id, action: 'HOSPITAL_UPDATED', resourceType: 'Hospital', resourceId: request.params.id, request }); response.json({ success: true, data }); },
};
