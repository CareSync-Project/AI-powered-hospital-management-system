import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema } from '../validators/commonValidators.js';
import { appointmentQuerySchema, createAppointmentSchema } from '../validators/appointmentValidators.js';

const router = Router();
router.get('/', validate({ query: appointmentQuerySchema }), asyncHandler(appointmentController.list));
router.post('/', validate({ body: createAppointmentSchema }), asyncHandler(appointmentController.create));
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(appointmentController.get));
export default router;
