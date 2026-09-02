import { doctorService } from '../services/doctorService.js';
import { getDoctorProfileId } from '../services/authorizationService.js';

export const doctorController = {
  async allAppointments(request, response) {
    const doctorId = getDoctorProfileId(request.auth);
    response.json({ success: true, data: await doctorService.allAppointments(doctorId) });
  },
  async updateStatus(request, response) {
    const doctorId = getDoctorProfileId(request.auth);
    const { appointmentId } = request.params;
    const { status } = request.body;
    response.json({ success: true, data: await doctorService.updateAppointmentStatus(doctorId, appointmentId, status, request) });
  },
  async today(request, response) {
    const doctorId = getDoctorProfileId(request.auth);
    response.json({ success: true, data: await doctorService.dailyAppointments(doctorId) });
  },
  async reports(request, response) {
    const doctorId = getDoctorProfileId(request.auth);
    response.json({ success: true, data: await doctorService.reports(doctorId) });
  },
  async list(request, response) { response.json({ success: true, data: await doctorService.listByHospital(request.params.hospitalId) }); },
  async get(request, response) { response.json({ success: true, data: await doctorService.get(request.params.id) }); },
  async affiliate(request, response) { response.status(201).json({ success: true, data: await doctorService.createAffiliation({ ...request.body, doctorId: request.params.id }) }); },
  async assignDepartment(request, response) { response.status(201).json({ success: true, data: await doctorService.assignDepartment({ ...request.body, doctorId: request.params.id }) }); },
};
