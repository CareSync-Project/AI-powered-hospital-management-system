import { patientService } from '../services/patientService.js';

export const patientController = {
  async get(request, response) { response.json({ success: true, data: await patientService.get(request.params.id) }); },
};
