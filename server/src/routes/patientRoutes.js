import { Router } from 'express';
import { patientController } from '../controllers/patientController.js';
import { patientCardController } from '../controllers/patientCardController.js';
import { vitalController } from '../controllers/vitalController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, patientParamsSchema } from '../validators/commonValidators.js';
import { createPatientCardSchema, verifyPatientCardSchema } from '../validators/patientCardValidators.js';
import { createVitalSchema } from '../validators/vitalValidators.js';

export const patientRouter = Router();
patientRouter.get('/:id', validate({ params: idParamsSchema }), asyncHandler(patientController.get));
patientRouter.get('/:patientId/cards', validate({ params: patientParamsSchema }), asyncHandler(patientCardController.list));
patientRouter.post('/:patientId/cards', validate({ params: patientParamsSchema, body: createPatientCardSchema }), asyncHandler(patientCardController.create));
patientRouter.get('/:patientId/vitals', validate({ params: patientParamsSchema }), asyncHandler(vitalController.list));
patientRouter.post('/:patientId/vitals', validate({ params: patientParamsSchema, body: createVitalSchema }), asyncHandler(vitalController.create));

export const patientCardRouter = Router();
patientCardRouter.patch('/:id/verification', validate({ params: idParamsSchema, body: verifyPatientCardSchema }), asyncHandler(patientCardController.verify));
