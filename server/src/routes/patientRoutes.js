import { Router } from 'express';
import { patientController } from '../controllers/patientController.js';
import { patientCardController } from '../controllers/patientCardController.js';
import { vitalController } from '../controllers/vitalController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, patientParamsSchema } from '../validators/commonValidators.js';
import { createPatientCardSchema, verifyPatientCardSchema } from '../validators/patientCardValidators.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requirePatientOwnership, requirePatientRecordAccess } from '../middleware/authorization.js';

export const patientRouter = Router();
patientRouter.use(authenticate);
patientRouter.get('/:id', validate({ params: idParamsSchema }), requirePatientRecordAccess, asyncHandler(patientController.get));
patientRouter.get('/:patientId/cards', validate({ params: patientParamsSchema }), requirePatientOwnership('patientId'), asyncHandler(patientCardController.list));
patientRouter.post('/:patientId/cards', requireRole('PATIENT'), validate({ params: patientParamsSchema, body: createPatientCardSchema }), requirePatientOwnership('patientId'), asyncHandler(patientCardController.create));
patientRouter.get('/:patientId/vitals', validate({ params: patientParamsSchema }), requirePatientRecordAccess, asyncHandler(vitalController.list));

export const patientCardRouter = Router();
patientCardRouter.patch('/:id/verification', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: verifyPatientCardSchema }), asyncHandler(patientCardController.verify));
