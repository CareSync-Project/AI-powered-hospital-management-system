import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditService } from './auditService.js';
import { notificationService } from './notificationService.js';
const RULES = { NURSE: { CONFIRMED: 'CHECKED_IN', CHECKED_IN: 'TRIAGED', TRIAGED: 'WAITING' }, DOCTOR: { WAITING: 'IN_CONSULTATION', IN_CONSULTATION: 'COMPLETED' }, ADMIN: { CONFIRMED: 'CHECKED_IN' } };
const TIMESTAMPS = { CHECKED_IN: 'checkedInAt', TRIAGED: 'triagedAt', IN_CONSULTATION: 'consultationStartedAt', COMPLETED: 'completedAt' };
export const appointmentWorkflowService = {
  async transition({ appointmentId, actor, toStatus, action, request, client = prisma, notify = false }) {
    const appointment = await client.appointment.findUnique({ where: { id: appointmentId }, include: { patient: { select: { userId: true } } } });
    if (!appointment) throw new AppError('Appointment not found', 404);
    const hospitalId = actor.role === 'NURSE' ? actor.user.nurseProfile?.hospitalId : actor.role === 'ADMIN' ? actor.user.adminProfile?.hospitalId : null;
    if (hospitalId && hospitalId !== appointment.hospitalId) throw new AppError('Not authorized for this hospital', 403);
    if (actor.role === 'NURSE') {
      const assignment = await client.nurseAppointmentAssignment.findFirst({ where: { appointmentId, nurseId: actor.user.nurseProfile?.id, active: true }, select: { id: true } });
      if (!assignment) throw new AppError('Only the nurse assigned to this appointment can perform this action', 403);
    }
    if (actor.role === 'DOCTOR' && actor.user.doctorProfile?.id !== appointment.doctorId) throw new AppError('Doctor is not assigned to this appointment', 403);
    if (RULES[actor.role]?.[appointment.status] !== toStatus) throw new AppError(`Invalid appointment transition from ${appointment.status} to ${toStatus}`, 409);
    const timestamp = TIMESTAMPS[toStatus]; const now = new Date();
    const changed = await client.appointment.updateMany({ where: { id: appointmentId, status: appointment.status }, data: { status: toStatus, ...(timestamp ? { [timestamp]: now } : {}) } });
    if (changed.count !== 1) throw new AppError('Appointment status changed concurrently', 409);
    await auditService.record({ userId: actor.userId, hospitalId: appointment.hospitalId, action, resourceType: 'Appointment', resourceId: appointmentId, metadata: { fromStatus: appointment.status, toStatus, actorRole: actor.role }, request }, client);
    if (notify) await notificationService.create({ userId: appointment.patient.userId, hospitalId: appointment.hospitalId, title: toStatus === 'CHECKED_IN' ? 'Check-in acknowledged' : 'Appointment updated', message: `Your appointment is now ${toStatus.replaceAll('_', ' ').toLowerCase()}.`, type: 'APPOINTMENT' }, client);
    return client.appointment.findUnique({ where: { id: appointmentId } });
  },
};
