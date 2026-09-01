import api from './api';

export const nurseManagementService = {
  list: () => api.get('/admin/nurses'),
  create: (data) => api.post('/admin/nurses', data),
};
