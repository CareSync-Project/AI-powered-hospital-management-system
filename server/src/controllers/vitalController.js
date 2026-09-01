import { vitalService } from '../services/vitalService.js';

export const vitalController = {
  async list(request, response) { response.json({ success: true, data: await vitalService.list(request.params.patientId) }); },
  async create(request, response) { response.status(201).json({ success: true, data: await vitalService.create(request.params.patientId, request.body) }); },
};
