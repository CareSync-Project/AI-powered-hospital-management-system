import api, { setAccessToken, refreshAccessToken } from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerPatient: (registration) => api.post('/auth/register', registration),
  register: (registration) => api.post('/auth/register', registration),
  logout: () => api.post('/auth/logout', {}),
  logoutAll: () => api.post('/auth/logout-all', {}),
  refreshSession: refreshAccessToken,
  getCurrentUser: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  setAccessToken,
  clearToken: () => setAccessToken(null),
};

export default authService;
