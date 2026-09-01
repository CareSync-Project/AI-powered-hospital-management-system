import { superAdminService } from '../services/superAdminService.js';

export const superAdminController = {
  async hospitals(_request, response) { response.json({ success: true, data: await superAdminService.hospitals() }); },
  async admins(_request, response) { response.json({ success: true, data: await superAdminService.admins() }); },
  async createAdmin(request, response) { response.status(201).json({ success: true, data: await superAdminService.createAdmin(request.auth, request.body, request) }); },
  async updateAdmin(request, response) { response.json({ success: true, data: await superAdminService.setAdminActive(request.auth, request.params.userId, request.body.active, request) }); },
};
