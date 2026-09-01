import { Router } from 'express';
import { z } from 'zod';
import { doctorController } from '../controllers/doctorController.js';
import { scheduleController } from '../controllers/scheduleController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamsSchema, doctorParamsSchema, dateString, uuid } from '../validators/commonValidators.js';
import { doctorScheduleSchema } from '../validators/scheduleValidators.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { requireAdminHospitalFromBody } from '../middleware/authorization.js';
import { managementScheduleController } from '../controllers/managementScheduleController.js';
import { slotDateQuerySchema } from '../validators/scheduleValidators.js';

const affiliationSchema = z.object({ hospitalId: uuid, employeeNumber: z.string().trim().min(2).max(50), startedAt: dateString.transform((value) => new Date(`${value}T00:00:00.000Z`)), active: z.boolean().optional().default(true) });
const assignmentSchema = z.object({ hospitalId: uuid, departmentId: uuid, primaryDepartment: z.boolean().optional().default(false), active: z.boolean().optional().default(true) });

const router = Router();
router.get('/me/schedule', authenticate, requireRole('DOCTOR'), asyncHandler(managementScheduleController.mySchedule));
router.get('/:doctorId/available-slots', validate({ params: doctorParamsSchema, query: slotDateQuerySchema }), asyncHandler(managementScheduleController.doctorSlots));
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(doctorController.get));
router.post('/:id/affiliations', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: affiliationSchema }), requireAdminHospitalFromBody, asyncHandler(doctorController.affiliate));
router.post('/:id/departments', authenticate, requireRole('ADMIN'), validate({ params: idParamsSchema, body: assignmentSchema }), requireAdminHospitalFromBody, asyncHandler(doctorController.assignDepartment));
router.get('/:doctorId/schedules', validate({ params: doctorParamsSchema }), asyncHandler(scheduleController.listDoctor));
router.post('/:doctorId/schedules', authenticate, requireRole('ADMIN'), validate({ params: doctorParamsSchema, body: doctorScheduleSchema.omit({ doctorId: true }) }), requireAdminHospitalFromBody, asyncHandler(scheduleController.createDoctor));
export default router;
