import api from './api';
export const patientCardService = {
  list: () => api.get('/patient/cards'),
  create: (data) => api.post('/patient/cards', data),
};
