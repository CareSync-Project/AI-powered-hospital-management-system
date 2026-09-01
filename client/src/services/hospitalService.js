import api from './api';
export const hospitalService = { getManaged: () => api.get('/admin/hospital'), updateManaged: (data) => api.patch('/admin/hospital', data), listPublic: () => api.get('/hospitals') };
