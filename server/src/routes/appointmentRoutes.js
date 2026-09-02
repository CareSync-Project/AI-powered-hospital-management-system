import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema } from '../validators/commonValidators.js';
import { appointmentQuerySchema, createAppointmentSchema } from '../validators/appointmentValidators.js';
import { authenticate, requireAnyRole } from '../middleware/authenticate.js';
import { requireAppointmentRecordAccess } from '../middleware/authorization.js';

const router = Router();
router.use(authenticate);
router.get('/', validate({ query: appointmentQuerySchema }), asyncHandler(appointmentController.list));
router.post('/', requireAnyRole('PATIENT', 'NURSE', 'ADMIN'), validate({ body: createAppointmentSchema }), asyncHandler(appointmentController.create));
router.get('/:id', validate({ params: idParamsSchema }), requireAppointmentRecordAccess, asyncHandler(appointmentController.get));
export default router;
