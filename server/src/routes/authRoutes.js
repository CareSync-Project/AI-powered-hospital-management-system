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
export default router;
