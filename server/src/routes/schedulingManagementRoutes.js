import { Router } from 'express';
import { managementScheduleController } from '../controllers/managementScheduleController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema } from '../validators/commonValidators.js';
import { scheduleExceptionSchema, updateDepartmentScheduleSchema, updateDoctorScheduleSchema } from '../validators/scheduleValidators.js';

export const departmentScheduleRouter = Router();
departmentScheduleRouter.patch('/:id', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: updateDepartmentScheduleSchema }), asyncHandler(managementScheduleController.updateDepartment));

export const doctorScheduleRouter = Router();
doctorScheduleRouter.patch('/:id', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: updateDoctorScheduleSchema }), asyncHandler(managementScheduleController.updateDoctor));

export const scheduleExceptionRouter = Router();
scheduleExceptionRouter.patch('/:id', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: scheduleExceptionSchema }), asyncHandler(managementScheduleController.updateException));
