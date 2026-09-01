import { departmentService } from '../services/departmentService.js';

export const departmentController = {
  async list(request, response) { response.json({ success: true, data: await departmentService.listByHospital(request.params.hospitalId) }); },
  async get(request, response) { response.json({ success: true, data: await departmentService.get(request.params.id) }); },
  async create(request, response) { response.status(201).json({ success: true, data: await departmentService.create(request.params.hospitalId, request.body) }); },
  async update(request, response) { response.json({ success: true, data: await departmentService.update(request.params.id, request.body) }); },
};
