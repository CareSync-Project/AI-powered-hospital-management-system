import api from './api';
export const notificationService = {
  list: () => api.get('/patient/notifications'),
  markRead: (id) => api.patch(`/patient/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/patient/notifications/read-all', {}),
};
