import { departmentService } from '../services/departmentService.js';
import { auditService } from '../services/auditService.js';

export const departmentController = {
  async list(request, response) { response.json({ success: true, data: await departmentService.listByHospital(request.params.hospitalId) }); },
  async get(request, response) { response.json({ success: true, data: await departmentService.get(request.params.id) }); },
  async create(request, response) { const data = await departmentService.create(request.params.hospitalId, request.body); await auditService.record({ userId: request.auth.userId, hospitalId: request.params.hospitalId, action: 'DEPARTMENT_CREATED', resourceType: 'Department', resourceId: data.id, request }); response.status(201).json({ success: true, data }); },
  async update(request, response) { const data = await departmentService.update(request.params.id, request.body); await auditService.record({ userId: request.auth.userId, hospitalId: data.hospitalId, action: 'DEPARTMENT_UPDATED', resourceType: 'Department', resourceId: data.id, request }); response.json({ success: true, data }); },
};
