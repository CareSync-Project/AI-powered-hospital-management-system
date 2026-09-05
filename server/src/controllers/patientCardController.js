import { patientCardService } from '../services/patientCardService.js';
import { auditService } from '../services/auditService.js';
import { getAdminHospitalId } from '../services/authorizationService.js';

export const patientCardController = {
  async listPending(request, response) { response.json({ success: true, data: await patientCardService.listPendingForHospital(getAdminHospitalId(request.auth)) }); },
  async list(request, response) { response.json({ success: true, data: await patientCardService.list(request.params.patientId) }); },
  async create(request, response) {
    const card = await patientCardService.create(request.params.patientId, request.body);
    await auditService.record({ userId: request.auth.user.id, hospitalId: card.hospitalId, action: 'PATIENT_CARD_SUBMITTED', resourceType: 'PatientCard', resourceId: card.id, request });
    response.status(201).json({ success: true, data: card });
  },
  async verify(request, response) {
    const card = await patientCardService.verify(request.params.id, { ...request.body, verifiedByAdminId: request.auth.user.adminProfile.id });
    await auditService.record({ userId: request.auth.user.id, hospitalId: card.hospitalId, action: card.verificationStatus === 'VERIFIED' ? 'PATIENT_CARD_VERIFIED' : 'PATIENT_CARD_REJECTED', resourceType: 'PatientCard', resourceId: card.id, request });
    response.json({ success: true, data: card });
  },
};
