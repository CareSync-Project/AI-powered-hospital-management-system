import { appointmentService } from '../services/appointmentService.js';

export const appointmentController = {
  async list(request, response) { response.json({ success: true, data: await appointmentService.list(request.validatedQuery || request.query) }); },
  async get(request, response) { response.json({ success: true, data: await appointmentService.get(request.params.id) }); },
  async create(request, response) { response.status(201).json({ success: true, data: await appointmentService.create(request.body) }); },
};
