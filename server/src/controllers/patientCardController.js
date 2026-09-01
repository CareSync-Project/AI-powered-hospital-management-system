import { patientCardService } from '../services/patientCardService.js';

export const patientCardController = {
  async list(request, response) { response.json({ success: true, data: await patientCardService.list(request.params.patientId) }); },
  async create(request, response) { response.status(201).json({ success: true, data: await patientCardService.create(request.params.patientId, request.body) }); },
  async verify(request, response) { response.json({ success: true, data: await patientCardService.verify(request.params.id, request.body) }); },
};
