import { vitalService } from '../services/vitalService.js';

export const vitalController = {
  async list(request, response) { response.json({ success: true, data: await vitalService.list(request.params.patientId) }); },
};
