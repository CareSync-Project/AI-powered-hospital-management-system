import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditService } from './auditService.js';

export const triageService = {
  async save(appointmentId, nurse, data, request) {
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.hospitalId !== nurse.hospitalId) throw new AppError('Not authorized for this hospital', 403);
      const assignment = await tx.nurseAppointmentAssignment.findFirst({ where: { appointmentId, nurseId: nurse.id, active: true }, select: { id: true } });
      if (!assignment) throw new AppError('Only the nurse assigned to this appointment can triage this patient', 403);
      if (appointment.status !== 'CHECKED_IN') throw new AppError('Triage requires a checked-in appointment', 409);
      const latest = await tx.triageRecord.findFirst({ where: { appointmentId }, orderBy: { createdAt: 'desc' } });
      const record = latest
        ? await tx.triageRecord.update({ where: { id: latest.id }, data: { chiefComplaint: data.chiefComplaint, triageNotes: data.triageNotes || null, urgencyLevel: data.urgencyLevel, nurseId: nurse.id } })
        : await tx.triageRecord.create({ data: { appointmentId, patientId: appointment.patientId, hospitalId: appointment.hospitalId, nurseId: nurse.id, chiefComplaint: data.chiefComplaint, triageNotes: data.triageNotes || null, urgencyLevel: data.urgencyLevel } });
      const changed = await tx.appointment.updateMany({ where: { id: appointmentId, status: 'CHECKED_IN' }, data: { status: 'TRIAGED', triagedAt: new Date(), urgency: data.urgencyLevel } });
      if (changed.count !== 1) throw new AppError('Appointment changed concurrently', 409);
      await auditService.record({ userId: nurse.userId, hospitalId: nurse.hospitalId, action: latest ? 'TRIAGE_UPDATED' : 'TRIAGE_CREATED', resourceType: 'TriageRecord', resourceId: record.id, metadata: { appointmentId, urgencyLevel: data.urgencyLevel }, request }, tx);
      return record;
    }, { isolationLevel: 'Serializable' });
  },
};
