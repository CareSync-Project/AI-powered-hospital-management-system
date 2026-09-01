import { hospitalService } from '../services/hospitalService.js';

export const hospitalController = {
  async list(_request, response) { response.json({ success: true, data: await hospitalService.list() }); },
  async get(request, response) { response.json({ success: true, data: await hospitalService.get(request.params.id) }); },
  async create(request, response) { response.status(201).json({ success: true, data: await hospitalService.create(request.body) }); },
  async update(request, response) { response.json({ success: true, data: await hospitalService.update(request.params.id, request.body) }); },
};
