import { Router } from 'express';
import { hospitalController } from '../controllers/hospitalController.js';
import { departmentController } from '../controllers/departmentController.js';
import { doctorController } from '../controllers/doctorController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHospitalSchema, updateHospitalSchema } from '../validators/hospitalValidators.js';
import { createDepartmentSchema } from '../validators/departmentValidators.js';
import { hospitalParamsSchema, idParamsSchema } from '../validators/commonValidators.js';

const router = Router();
router.get('/', asyncHandler(hospitalController.list));
router.post('/', validate({ body: createHospitalSchema }), asyncHandler(hospitalController.create));
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(hospitalController.get));
router.patch('/:id', validate({ params: idParamsSchema, body: updateHospitalSchema }), asyncHandler(hospitalController.update));
router.get('/:hospitalId/departments', validate({ params: hospitalParamsSchema }), asyncHandler(departmentController.list));
router.post('/:hospitalId/departments', validate({ params: hospitalParamsSchema, body: createDepartmentSchema }), asyncHandler(departmentController.create));
router.get('/:hospitalId/doctors', validate({ params: hospitalParamsSchema }), asyncHandler(doctorController.list));
export default router;
