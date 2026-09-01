import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createDoctorAccountSchema, createNurseAccountSchema } from '../validators/staffValidators.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));
router.post('/doctors', validate({ body: createDoctorAccountSchema }), asyncHandler(adminController.createDoctor));
router.post('/nurses', validate({ body: createNurseAccountSchema }), asyncHandler(adminController.createNurse));
export default router;
