import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginRateLimiter, refreshRateLimiter } from '../middleware/authRateLimiters.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { changePasswordSchema, loginSchema, registerPatientSchema } from '../validators/authValidators.js';

const router = Router();
router.post('/register', validate({ body: registerPatientSchema }), asyncHandler(authController.register));
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), asyncHandler(authController.login));
router.post('/refresh', refreshRateLimiter, asyncHandler(authController.refresh));
router.get('/me', authenticate, asyncHandler(authController.me));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/logout-all', authenticate, asyncHandler(authController.logoutAll));
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(authController.changePassword));
import { notificationService } from '../services/notificationService.js';

router.get('/notifications', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await notificationService.list(req.auth.userId) });
}));
router.patch('/notifications/read-all', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await notificationService.markAllRead(req.auth.userId) });
}));
router.patch('/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await notificationService.markRead(req.params.id, req.auth.userId) });
}));

export default router;
