import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'hospital_refresh_token';
export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
};
export const clearRefreshCookie = (response) => response.clearCookie(REFRESH_COOKIE_NAME, {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
});
