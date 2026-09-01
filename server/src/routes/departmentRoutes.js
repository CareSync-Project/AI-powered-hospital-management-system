import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import { scheduleController } from '../controllers/scheduleController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, departmentParamsSchema } from '../validators/commonValidators.js';
import { updateDepartmentSchema } from '../validators/departmentValidators.js';
import { departmentScheduleSchema } from '../validators/scheduleValidators.js';

const router = Router();
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(departmentController.get));
router.patch('/:id', validate({ params: idParamsSchema, body: updateDepartmentSchema }), asyncHandler(departmentController.update));
router.get('/:departmentId/schedules', validate({ params: departmentParamsSchema }), asyncHandler(scheduleController.listDepartment));
router.post('/:departmentId/schedules', validate({ params: departmentParamsSchema, body: departmentScheduleSchema.omit({ departmentId: true }) }), asyncHandler(scheduleController.createDepartment));
export default router;
