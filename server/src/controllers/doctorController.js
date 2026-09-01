import { doctorService } from '../services/doctorService.js';

export const doctorController = {
  async list(request, response) { response.json({ success: true, data: await doctorService.listByHospital(request.params.hospitalId) }); },
  async get(request, response) { response.json({ success: true, data: await doctorService.get(request.params.id) }); },
  async affiliate(request, response) { response.status(201).json({ success: true, data: await doctorService.createAffiliation({ ...request.body, doctorId: request.params.id }) }); },
  async assignDepartment(request, response) { response.status(201).json({ success: true, data: await doctorService.assignDepartment({ ...request.body, doctorId: request.params.id }) }); },
};
