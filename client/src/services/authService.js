import api, { setAccessToken } from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (registration) => api.post('/auth/register', registration),
  getProfile: () => api.get('/auth/me'),
  setAccessToken,
  clearToken: () => setAccessToken(null),
};

export default authService;
