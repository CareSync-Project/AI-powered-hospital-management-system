import api from './api';

export const announcementService = {
  list: () => api.get('/admin/announcements'),
  create: (body) => api.post('/admin/announcements', body),
};
