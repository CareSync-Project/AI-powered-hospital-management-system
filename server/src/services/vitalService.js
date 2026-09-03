import { vitalRepository } from '../repositories/vitalRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { calculateBmi } from '../utils/bmi.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/prisma.js';
import { vitalAssessmentService } from './vitalAssessmentService.js';
import { auditService } from './auditService.js';

const serialize = (record) => ({ ...record, assessment: vitalAssessmentService.assess(record) });

export const vitalService = {
  async list(patientId) { return (await vitalRepository.findByPatient(patientId)).map(serialize); },
  async create(patientId, data) {
    const [patient, hospital] = await Promise.all([patientRepository.findById(patientId), hospitalRepository.findById(data.hospitalId)]);
    if (!patient) throw new AppError('Patient not found', 404);
    if (!hospital) throw new AppError('Hospital not found', 404);
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({ where: { id: data.appointmentId }, select: { patientId: true, hospitalId: true } });
      if (!appointment || appointment.patientId !== patientId || appointment.hospitalId !== data.hospitalId) throw new AppError('Appointment does not belong to this patient and hospital', 403);
    }
    const bmi = data.weight != null && data.height != null ? calculateBmi(data.weight, data.height) : null;
    return serialize(await vitalRepository.create({
      ...data,
      patientId,
      bmi,
      verificationStatus: data.source === 'PATIENT' ? 'UNVERIFIED' : (data.verificationStatus || 'UNVERIFIED'),
    }));
  },
  async listForAppointment(appointmentId, auth) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw new AppError('Appointment not found', 404);
    const hospitalId = auth.user.nurseProfile?.hospitalId;
    const doctorId = auth.user.doctorProfile?.id;
    if ((auth.role === 'NURSE' && hospitalId !== appointment.hospitalId) || (auth.role === 'DOCTOR' && doctorId !== appointment.doctorId)) throw new AppError('Not authorized', 403);
    return (await prisma.vitalRecord.findMany({ where: { appointmentId }, orderBy: { recordedAt: 'desc' } })).map(serialize);
  },
  async createClinical(appointmentId, auth, data, request) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw new AppError('Appointment not found', 404);
    const nurse = auth.user.nurseProfile;
    if (auth.role !== 'NURSE' || !nurse || nurse.hospitalId !== appointment.hospitalId) throw new AppError('Not authorized', 403);
    const assignment = await prisma.nurseAppointmentAssignment.findFirst({
      where: { appointmentId, nurseId: nurse.id, active: true },
      select: { id: true },
    });
    if (!assignment) throw new AppError('Only the nurse assigned to this appointment can record vital signs', 403);
    if (!['CHECKED_IN','TRIAGED','WAITING','IN_CONSULTATION'].includes(appointment.status)) throw new AppError('Vitals cannot be recorded at this workflow status', 409);
    const record = await vitalService.create(appointment.patientId, { ...data, appointmentId, hospitalId: appointment.hospitalId, source: auth.role, verificationStatus: 'VERIFIED', recordedByUserId: auth.userId });
    await auditService.record({ userId: auth.userId, hospitalId: appointment.hospitalId, action: 'VITAL_RECORDED', resourceType: 'VitalRecord', resourceId: record.id, metadata: { appointmentId, source: auth.role }, request });
    return record;
  },
  async verify(vitalId, auth, request) {
    const record = await prisma.vitalRecord.findUnique({ where: { id: vitalId } });
    if (!record) throw new AppError('Vital record not found', 404);
    if (auth.role !== 'NURSE' || auth.user.nurseProfile?.hospitalId !== record.hospitalId) throw new AppError('Not authorized', 403);
    if (record.source !== 'PATIENT') throw new AppError('Only patient-entered vitals require this review', 409);
    const updated = await prisma.vitalRecord.update({ where: { id: vitalId }, data: { verificationStatus: 'VERIFIED' } });
    await auditService.record({ userId: auth.userId, hospitalId: record.hospitalId, action: 'VITAL_VERIFIED', resourceType: 'VitalRecord', resourceId: vitalId, metadata: { source: record.source, appointmentId: record.appointmentId }, request });
    return serialize(updated);
  },
};
