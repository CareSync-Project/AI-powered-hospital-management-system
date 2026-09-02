import api from './api';

export const doctorService = {
  listManaged: () => api.get('/admin/doctors'),
  create: (data) => api.post('/admin/doctors', data),
  update: (id, data) => api.patch(`/admin/doctors/${id}`, data),
  assignDepartment: (id, data) => api.post(`/admin/doctors/${id}/departments`, data),
  removeDepartment: (doctorId, departmentId) => api.delete(`/admin/doctors/${doctorId}/departments/${departmentId}`),
  mySchedule: () => api.get('/doctors/me/schedule'),
  createMySchedule: (data) => api.post('/doctors/me/schedules', data),
  deleteMySchedule: (id) => api.delete(`/doctors/me/schedules/${id}`),
  createMyException: (data) => api.post('/doctors/me/exceptions', data),
  allAppointments: () => api.get('/doctors/me/appointments'),
  updateStatus: (appointmentId, status) => api.patch(`/doctors/me/appointments/${appointmentId}/status`, { status }),
  today: () => api.get('/doctors/me/appointments/today'),
  reports: () => api.get('/doctors/me/reports'),
  notifications: () => api.get('/doctors/me/notifications'),
  markNotificationRead: (id) => api.patch(`/doctors/me/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => api.patch('/doctors/me/notifications/read-all', {}),
};
