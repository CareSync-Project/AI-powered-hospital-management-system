import { vitalService } from '../services/vitalService.js';
import { getPatientProfileId } from '../services/authorizationService.js';

export const vitalController = {
  async list(request, response) { response.json({ success: true, data: await vitalService.list(request.params.patientId) }); },
  async create(request, response) {
    const data = { ...request.body, source: 'PATIENT', verificationStatus: 'UNVERIFIED', recordedByUserId: request.auth.user.id };
    response.status(201).json({ success: true, data: await vitalService.create(getPatientProfileId(request.auth), data) });
  },
};
