import { appointmentSlotService, scheduleService } from '../services/scheduleService.js';
import { getAdminHospitalId, getDoctorProfileId } from '../services/authorizationService.js';
import { auditService } from '../services/auditService.js';
import { AppError } from '../middleware/errorHandler.js';

const audit = (request, action, resourceType, resourceId) => auditService.record({ userId: request.auth.userId, hospitalId: getAdminHospitalId(request.auth), action, resourceType, resourceId, request });

export const managementScheduleController = {
  async updateDepartment(request, response) { const current = await scheduleService.updateDepartment(request.params.id, request.body, getAdminHospitalId(request.auth)); await audit(request, 'DEPARTMENT_SCHEDULE_UPDATED', 'DepartmentSchedule', current.id); response.json({ success: true, data: current }); },
  async updateDoctor(request, response) { const current = await scheduleService.updateDoctor(request.params.id, request.body, getAdminHospitalId(request.auth)); await audit(request, 'DOCTOR_SCHEDULE_UPDATED', 'DoctorSchedule', current.id); response.json({ success: true, data: current }); },
  async listExceptions(request, response) { response.json({ success: true, data: await scheduleService.listExceptions(request.params.doctorId, request.query.from, getAdminHospitalId(request.auth)) }); },
  async createException(request, response) { const result = await scheduleService.createException(request.params.doctorId, getAdminHospitalId(request.auth), request.body); await audit(request, 'SCHEDULE_EXCEPTION_CREATED', 'ScheduleException', result.exception.id); response.status(201).json({ success: true, data: result }); },
  async updateException(request, response) { const existing = await scheduleService.updateException(request.params.id, request.body, getAdminHospitalId(request.auth)); await audit(request, 'SCHEDULE_EXCEPTION_UPDATED', 'ScheduleException', existing.id); response.json({ success: true, data: existing }); },
  async generate(request, response) { const result = await appointmentSlotService.generate(request.params.doctorId, request.body.departmentId, request.body.date, getAdminHospitalId(request.auth)); await audit(request, 'APPOINTMENT_SLOTS_GENERATED', 'DoctorProfile', request.params.doctorId); response.json({ success: true, data: result }); },
  async doctorSlots(request, response) { response.json({ success: true, data: await appointmentSlotService.listDoctor(request.params.doctorId, request.validatedQuery.date) }); },
  async departmentSlots(request, response) { response.json({ success: true, data: await appointmentSlotService.listDepartment(request.params.departmentId, request.validatedQuery.date) }); },
  async mySchedule(request, response) { const doctorId = getDoctorProfileId(request.auth); response.json({ success: true, data: { schedules: await scheduleService.listDoctor(doctorId), exceptions: await scheduleService.listExceptions(doctorId, new Date().toISOString().slice(0, 10)) } }); },
};
