import { authService } from '../services/authService.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions, clearRefreshCookie } from '../utils/authCookie.js';

const setSessionCookie = (response, token) => response.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);

export const authController = {
  async register(request, response) { response.status(201).json({ success: true, data: await authService.registerPatient(request.body, request) }); },
  async login(request, response) {
    const result = await authService.login(request.body, request);
    setSessionCookie(response, result.refreshToken);
    response.json({ success: true, data: { accessToken: result.accessToken, ...result.context } });
  },
  async refresh(request, response) {
    const result = await authService.refresh(request.cookies[REFRESH_COOKIE_NAME], request);
    setSessionCookie(response, result.refreshToken);
    response.json({ success: true, data: { accessToken: result.accessToken, ...result.context } });
  },
  async me(request, response) { response.json({ success: true, data: await authService.getCurrentUser(request.auth.userId) }); },
  async logout(request, response) { await authService.logout(request.auth.sessionId, request.auth.userId, request); clearRefreshCookie(response); response.json({ success: true, data: { loggedOut: true } }); },
  async logoutAll(request, response) { await authService.logoutAll(request.auth.userId, request); clearRefreshCookie(response); response.json({ success: true, data: { loggedOutAll: true } }); },
  async changePassword(request, response) {
    const result = await authService.changePassword(request.auth.userId, request.auth.sessionId, request.body, request);
    setSessionCookie(response, result.refreshToken);
    response.json({ success: true, data: { accessToken: result.accessToken, ...result.context } });
  },
};
