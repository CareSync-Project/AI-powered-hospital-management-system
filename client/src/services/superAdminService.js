import api from './api';

export const superAdminService = {
  hospitals: () => api.get('/super-admin/hospitals'),
  admins: () => api.get('/super-admin/admins'),
  createAdmin: (data) => api.post('/super-admin/admins', data),
  setAdminActive: (userId, active) => api.patch(`/super-admin/admins/${userId}`, { active }),
};
