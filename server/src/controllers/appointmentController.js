import { appointmentService } from '../services/appointmentService.js';
import { appointmentFiltersForAuth, getPatientProfileId, requireMatchingHospital } from '../services/authorizationService.js';
import { auditService } from '../services/auditService.js';
import { AppError } from '../middleware/errorHandler.js';

export const appointmentController = {
  async list(request, response) {
    const supplied = request.validatedQuery || request.query;
    response.json({ success: true, data: await appointmentService.list({ ...supplied, ...appointmentFiltersForAuth(request.auth) }) });
  },
  async get(request, response) { response.json({ success: true, data: await appointmentService.get(request.params.id) }); },
  async create(request, response) {
    const data = { ...request.body };
    if (request.auth.role === 'PATIENT') {
      data.patientId = getPatientProfileId(request.auth);
      data.bookingMethod = 'PATIENT_PWA';
    } else {
      if (!data.patientId) throw new AppError('patientId is required for staff-assisted booking', 400);
      requireMatchingHospital(request.auth, data.hospitalId);
      data.bookingMethod = 'STAFF';
    }
    const appointment = await appointmentService.create(data);
    await auditService.record({ userId: request.auth.user.id, hospitalId: appointment.hospitalId, action: 'APPOINTMENT_CREATED', resourceType: 'Appointment', resourceId: appointment.id, request });
    response.status(201).json({ success: true, data: appointment });
  },
};
