import { staffAccountService } from '../services/staffAccountService.js';

export const adminController = {
  async createDoctor(request, response) {
    response.status(201).json({ success: true, data: await staffAccountService.createDoctor(request.auth, request.body, request) });
  },
  async createNurse(request, response) {
    response.status(201).json({ success: true, data: await staffAccountService.createNurse(request.auth, request.body, request) });
  },
};
