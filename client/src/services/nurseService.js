import api from './api';
export const nurseService = {
  create: (data) => api.post('/admin/nurses', data),
  list: () => api.get('/admin/nurses')
};
