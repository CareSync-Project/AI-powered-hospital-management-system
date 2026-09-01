import { Router } from 'express';
import { z } from 'zod';
import { doctorController } from '../controllers/doctorController.js';
import { scheduleController } from '../controllers/scheduleController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, doctorParamsSchema, dateString, uuid } from '../validators/commonValidators.js';
import { doctorScheduleSchema } from '../validators/scheduleValidators.js';

const affiliationSchema = z.object({ hospitalId: uuid, employeeNumber: z.string().trim().min(2).max(50), startedAt: dateString.transform((value) => new Date(`${value}T00:00:00.000Z`)), active: z.boolean().optional().default(true) });
const assignmentSchema = z.object({ hospitalId: uuid, departmentId: uuid, primaryDepartment: z.boolean().optional().default(false), active: z.boolean().optional().default(true) });

const router = Router();
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(doctorController.get));
router.post('/:id/affiliations', validate({ params: idParamsSchema, body: affiliationSchema }), asyncHandler(doctorController.affiliate));
router.post('/:id/departments', validate({ params: idParamsSchema, body: assignmentSchema }), asyncHandler(doctorController.assignDepartment));
router.get('/:doctorId/schedules', validate({ params: doctorParamsSchema }), asyncHandler(scheduleController.listDoctor));
router.post('/:doctorId/schedules', validate({ params: doctorParamsSchema, body: doctorScheduleSchema.omit({ doctorId: true }) }), asyncHandler(scheduleController.createDoctor));
export default router;
