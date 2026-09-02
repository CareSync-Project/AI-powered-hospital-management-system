import api from './api';
export const patientService = {
  hospitals: () => api.get('/patient/hospitals'),
  departments: () => api.get('/patient/departments'),
  availability: (departmentId) => api.get(`/patient/departments/${departmentId}/availability`),
  doctors: (departmentId, date) => api.get(`/patient/departments/${departmentId}/doctors${date ? `?date=${date}` : ''}`),
  recommendation: (departmentId, date) => api.get(`/patient/recommendation?departmentId=${departmentId}&date=${date}`),
  profile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.patch('/patient/profile', data),
};
