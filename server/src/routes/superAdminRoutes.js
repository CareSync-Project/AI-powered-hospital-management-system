import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uuid } from '../validators/commonValidators.js';
import { createHospitalAdminSchema, updateHospitalAdminSchema } from '../validators/superAdminValidators.js';
import { superAdminController } from '../controllers/superAdminController.js';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));
router.get('/hospitals', asyncHandler(superAdminController.hospitals));
router.get('/admins', asyncHandler(superAdminController.admins));
router.post('/admins', validate({ body: createHospitalAdminSchema }), asyncHandler(superAdminController.createAdmin));
router.patch('/admins/:userId', validate({ params: z.object({ userId: uuid }), body: updateHospitalAdminSchema }), asyncHandler(superAdminController.updateAdmin));
export default router;
