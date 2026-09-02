import { symptomAssessmentService } from '../services/symptomAssessmentService.js';
import { getPatientProfileId } from '../services/authorizationService.js';
import { careSyncHospitalService } from '../services/careSyncHospitalService.js';

export const symptomAssessmentController = {
  async create(request, response) { const hospital = await careSyncHospitalService.get(); response.status(201).json({ success: true, data: await symptomAssessmentService.create(request.auth.user.patientProfile, request.auth.userId, { ...request.body, hospitalId: hospital.id }, request) }); },
  async list(request, response) { response.json({ success: true, data: await symptomAssessmentService.list(getPatientProfileId(request.auth)) }); },
  async get(request, response) { response.json({ success: true, data: await symptomAssessmentService.get(request.params.id, getPatientProfileId(request.auth)) }); },
  async clinical(request, response) { response.json({ success: true, data: await symptomAssessmentService.clinicalForAppointment(request.params.id, request.auth) }); },
};
