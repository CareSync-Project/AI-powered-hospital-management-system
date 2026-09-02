import { scheduleService } from '../services/scheduleService.js';

export const scheduleController = {
  async listDepartment(request, response) { response.json({ success: true, data: await scheduleService.listDepartment(request.params.departmentId) }); },
  async listDoctor(request, response) { response.json({ success: true, data: await scheduleService.listDoctor(request.params.doctorId) }); },
  async createDepartment(request, response) { response.status(201).json({ success: true, data: await scheduleService.createDepartment({ ...request.body, departmentId: request.params.departmentId }) }); },
  async createDoctor(request, response) { response.status(201).json({ success: true, data: await scheduleService.createDoctor({ ...request.body, doctorId: request.params.doctorId }) }); },
};
