import { staffAccountService } from '../services/staffAccountService.js';
import { doctorService } from '../services/doctorService.js';
import { scheduleService } from '../services/scheduleService.js';
import { getAdminHospitalId } from '../services/authorizationService.js';
import { auditService } from '../services/auditService.js';
import { hospitalService } from '../services/hospitalService.js';
import { departmentService } from '../services/departmentService.js';

export const adminController = {
  async hospital(request, response) { response.json({ success: true, data: await hospitalService.getManagement(getAdminHospitalId(request.auth)) }); },
  async updateHospital(request, response) { const hospitalId = getAdminHospitalId(request.auth); const data = await hospitalService.update(hospitalId, request.body); await auditService.record({ userId: request.auth.userId, hospitalId, action: 'HOSPITAL_UPDATED', resourceType: 'Hospital', resourceId: hospitalId, request }); response.json({ success: true, data }); },
  async departments(request, response) { response.json({ success: true, data: await departmentService.listManagement(getAdminHospitalId(request.auth)) }); },
  async createDepartment(request, response) { const hospitalId = getAdminHospitalId(request.auth); const data = await departmentService.create(hospitalId, request.body); await auditService.record({ userId: request.auth.userId, hospitalId, action: 'DEPARTMENT_CREATED', resourceType: 'Department', resourceId: data.id, request }); response.status(201).json({ success: true, data }); },
  async createDepartmentSchedule(request, response) { const hospitalId = getAdminHospitalId(request.auth); const data = await scheduleService.createDepartment({ ...request.body, hospitalId, departmentId: request.params.departmentId }); await auditService.record({ userId: request.auth.userId, hospitalId, action: 'DEPARTMENT_SCHEDULE_CREATED', resourceType: 'DepartmentSchedule', resourceId: data.id, request }); response.status(201).json({ success: true, data }); },
  async createDoctor(request, response) {
    response.status(201).json({ success: true, data: await staffAccountService.createDoctor(request.auth, request.body, request) });
  },
  async createNurse(request, response) {
    response.status(201).json({ success: true, data: await staffAccountService.createNurse(request.auth, request.body, request) });
  },
  async listDoctors(request, response) { response.json({ success: true, data: await doctorService.listForAdmin(getAdminHospitalId(request.auth)) }); },
  async updateDoctor(request, response) { const data = await doctorService.updateForHospital(request.params.doctorId, getAdminHospitalId(request.auth), request.body); await auditService.record({ userId: request.auth.userId, hospitalId: getAdminHospitalId(request.auth), action: 'DOCTOR_UPDATED', resourceType: 'DoctorProfile', resourceId: data.id, request }); response.json({ success: true, data }); },
  async assignDepartment(request, response) { const data = await doctorService.assignDepartment({ doctorId: request.params.doctorId, departmentId: request.body.departmentId, primaryDepartment: request.body.primaryDepartment, active: true, hospitalId: getAdminHospitalId(request.auth) }); await auditService.record({ userId: request.auth.userId, hospitalId: getAdminHospitalId(request.auth), action: 'DOCTOR_ASSIGNED_TO_DEPARTMENT', resourceType: 'DoctorDepartment', resourceId: data.id, request }); response.status(201).json({ success: true, data }); },
  async removeDepartment(request, response) { const data = await doctorService.deactivateAssignment(request.params.doctorId, request.params.departmentId, getAdminHospitalId(request.auth)); await auditService.record({ userId: request.auth.userId, hospitalId: getAdminHospitalId(request.auth), action: 'DOCTOR_REMOVED_FROM_DEPARTMENT', resourceType: 'DoctorDepartment', resourceId: data.id, request }); response.json({ success: true, data }); },
  async createDoctorSchedule(request, response) { const data = await scheduleService.createDoctor({ ...request.body, doctorId: request.params.doctorId, hospitalId: getAdminHospitalId(request.auth) }); await auditService.record({ userId: request.auth.userId, hospitalId: getAdminHospitalId(request.auth), action: 'DOCTOR_SCHEDULE_CREATED', resourceType: 'DoctorSchedule', resourceId: data.id, request }); response.status(201).json({ success: true, data }); },
};
