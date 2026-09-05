import api from './api';
export const appointmentService = {
  list: () => api.get('/patient/appointments'),
  get: (id) => api.get(`/patient/appointments/${id}`),
  book: (data) => api.post('/patient/appointments', data),
  staffBook: (data) => api.post('/appointments', data),
  cancel: (id, cancellationReason) => api.patch(`/patient/appointments/${id}/cancel`, { cancellationReason }),
  reschedule: (id, newSlotId) => api.patch(`/patient/appointments/${id}/reschedule`, { newSlotId }),
};
