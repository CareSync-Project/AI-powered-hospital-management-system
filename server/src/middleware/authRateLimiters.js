import { rateLimit } from 'express-rate-limit';

const createLimiter = (limit, windowMs, options = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  ...options,
});

// Successful authentication never consumes the allowance. Only failed
// responses count toward the temporary brute-force protection threshold.
export const loginRateLimiter = createLimiter(10, 15 * 60 * 1000, {
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed login attempts. Please try again later.' },
});
export const refreshRateLimiter = createLimiter(30, 15 * 60 * 1000);
