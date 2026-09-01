import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import { scheduleController } from '../controllers/scheduleController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, departmentParamsSchema } from '../validators/commonValidators.js';
import { updateDepartmentSchema } from '../validators/departmentValidators.js';
import { departmentScheduleSchema } from '../validators/scheduleValidators.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireAdminDepartmentAccess } from '../middleware/authorization.js';

const router = Router();
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(departmentController.get));
router.patch('/:id', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: updateDepartmentSchema }), requireAdminDepartmentAccess, asyncHandler(departmentController.update));
router.get('/:departmentId/schedules', validate({ params: departmentParamsSchema }), asyncHandler(scheduleController.listDepartment));
router.post('/:departmentId/schedules', authenticate, requireRole('ADMIN'), validate({ params: departmentParamsSchema, body: departmentScheduleSchema.omit({ departmentId: true }) }), requireAdminDepartmentAccess, asyncHandler(scheduleController.createDepartment));
export default router;
