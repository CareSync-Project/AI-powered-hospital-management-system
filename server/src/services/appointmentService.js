import { randomUUID } from 'node:crypto';
import prisma from '../config/prisma.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { doctorRepository } from '../repositories/doctorRepository.js';
import { patientCardRepository } from '../repositories/patientCardRepository.js';
import { validateDoctorDepartmentContext } from './doctorService.js';
import { AppError } from '../middleware/errorHandler.js';
import { timeToDate, validateTimeRange } from '../utils/time.js';
import { notificationService } from './notificationService.js';
import { auditService } from './auditService.js';

export function createAppointmentNumber(now = new Date(), idFactory = randomUUID) {
  return `APT-${now.getUTCFullYear()}-${idFactory().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export function assertSlotCapacity(slot) {
  if (slot.capacity < 1) throw new AppError('Appointment slot capacity must be at least one', 409);
  if (slot.bookedCount >= slot.capacity || slot.status !== 'AVAILABLE') throw new AppError('Appointment slot has no available capacity', 409);
}

export function assertSlotMatchesAppointment(slot, data) {
  if (slot.hospitalId !== data.hospitalId || slot.departmentId !== data.departmentId || slot.doctorId !== data.doctorId) {
    throw new AppError('Appointment slot does not match the selected hospital, department, and doctor', 400);
  }
  const requestedDate = new Date(`${data.appointmentDate}T00:00:00.000Z`).toISOString().slice(0, 10);
  if (slot.date.toISOString().slice(0, 10) !== requestedDate) throw new AppError('Appointment slot date does not match the appointment date', 400);
}

async function validateAppointmentContext(data, client) {
  const [patient, hospital, department] = await Promise.all([
    patientRepository.findById(data.patientId, client),
    hospitalRepository.findById(data.hospitalId, client),
    departmentRepository.findById(data.departmentId, client),
  ]);
  if (!patient?.active) throw new AppError('Patient not found or inactive', 404);
  if (!hospital?.active) throw new AppError('Hospital not found or inactive', 404);
  if (!department?.active || department.hospitalId !== data.hospitalId) throw new AppError('Department does not belong to the hospital or is inactive', 400);
  await validateDoctorDepartmentContext(data.doctorId, data.departmentId, data.hospitalId, { doctorRepository, departmentRepository }, client);

  if (data.patientCardId) {
    const card = await patientCardRepository.findById(data.patientCardId, client);
    if (!card || card.patientId !== data.patientId || card.hospitalId !== data.hospitalId || !card.active) {
      throw new AppError('Patient card does not belong to this patient and hospital', 400);
    }
  }
}

export const appointmentService = {
  list: (filters) => appointmentRepository.findMany(filters),
  async get(id) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new AppError('Appointment not found', 404);
    return appointment;
  },
  async create(data, database = prisma) {
    if (!validateTimeRange(data.startTime, data.endTime)) throw new AppError('Appointment start time must be before end time', 400);

    return database.$transaction(async (transaction) => {
      await validateAppointmentContext(data, transaction);
      let slot = null;

      if (data.appointmentSlotId) {
        slot = await appointmentRepository.findSlot(data.appointmentSlotId, transaction);
        if (!slot) throw new AppError('Appointment slot not found', 404);
        assertSlotMatchesAppointment(slot, data);
        assertSlotCapacity(slot);

        const reservation = await appointmentRepository.reserveSlotOptimistically(slot, transaction);
        if (reservation.count !== 1) {
          throw new AppError('Appointment slot was booked concurrently; choose another slot', 409);
        }
      }

      return appointmentRepository.create({
        ...data,
        appointmentNumber: createAppointmentNumber(),
        appointmentDate: new Date(`${data.appointmentDate}T00:00:00.000Z`),
        startTime: timeToDate(data.startTime),
        endTime: timeToDate(data.endTime),
        status: 'PENDING',
      }, transaction);
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 });
  },
  async createPatientBooking({ patientId, userId, slotId, patientCardId, reasonForVisit, symptomsSummary, request }, database = prisma) {
    return database.$transaction(async (tx) => {
      const [patient, slot, card] = await Promise.all([
        patientRepository.findById(patientId, tx), appointmentRepository.findSlot(slotId, tx), patientCardRepository.findById(patientCardId, tx),
      ]);
      if (!patient?.active || patient.userId !== userId) throw new AppError('Patient profile not found', 404);
      if (!slot || slot.date < new Date(new Date().toISOString().slice(0, 10))) throw new AppError('Appointment slot is not available', 409);
      assertSlotCapacity(slot);
      if (!card || card.patientId !== patientId || card.hospitalId !== slot.hospitalId || !card.active) throw new AppError('Patient card is not eligible for this booking', 400);
      if (card.verificationStatus !== 'VERIFIED') throw new AppError('A verified Hospital or NHIS card is required for prebooking', 403);
      await validateAppointmentContext({ patientId, hospitalId: slot.hospitalId, departmentId: slot.departmentId, doctorId: slot.doctorId, patientCardId }, tx);
      const conflict = await appointmentRepository.findPatientConflict(patientId, slot.date, slot.startTime, slot.endTime, null, tx);
      if (conflict) throw new AppError('You already have a conflicting appointment', 409);
      const reservation = await appointmentRepository.reserveSlotOptimistically(slot, tx);
      if (reservation.count !== 1) throw new AppError('Appointment slot was booked concurrently; choose another slot', 409);
      await tx.patientHospitalRecord.upsert({ where: { patientId_hospitalId: { patientId, hospitalId: slot.hospitalId } }, update: { status: 'ACTIVE' }, create: { patientId, hospitalId: slot.hospitalId, hospitalPatientNumber: `PRE-${patientId.slice(0, 8).toUpperCase()}`, status: 'ACTIVE', firstVisitAt: slot.date } });
      const appointment = await appointmentRepository.create({ patientId, hospitalId: slot.hospitalId, departmentId: slot.departmentId, doctorId: slot.doctorId, patientCardId, appointmentSlotId: slot.id, appointmentNumber: createAppointmentNumber(), appointmentDate: slot.date, startTime: slot.startTime, endTime: slot.endTime, reasonForVisit, symptomsSummary: symptomsSummary || null, urgency: 'ROUTINE', bookingMethod: 'PATIENT_PWA', status: 'PENDING' }, tx);
      await notificationService.create({ userId, hospitalId: slot.hospitalId, title: 'Appointment booked', message: `Appointment ${appointment.appointmentNumber} has been booked successfully.`, type: 'APPOINTMENT' }, tx);
      await auditService.record({ userId, hospitalId: slot.hospitalId, action: 'APPOINTMENT_CREATED', resourceType: 'Appointment', resourceId: appointment.id, request }, tx);
      return appointment;
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 });
  },
  async cancelPatientAppointment(id, patientId, userId, reason, request) {
    return prisma.$transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(id, tx);
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.patientId !== patientId) throw new AppError('Not authorized', 403);
      if (!['PENDING', 'CONFIRMED'].includes(appointment.status) || appointment.appointmentDate < new Date(new Date().toISOString().slice(0, 10))) throw new AppError('This appointment cannot be cancelled', 409);
      const updated = await appointmentRepository.update(id, { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason || null }, tx);
      if (appointment.appointmentSlotId) await appointmentRepository.releaseSlot(appointment.appointmentSlotId, tx);
      await notificationService.create({ userId, hospitalId: appointment.hospitalId, title: 'Appointment cancelled', message: `Appointment ${appointment.appointmentNumber} was cancelled.`, type: 'APPOINTMENT' }, tx);
      await auditService.record({ userId, hospitalId: appointment.hospitalId, action: 'APPOINTMENT_CANCELLED', resourceType: 'Appointment', resourceId: id, request }, tx);
      return updated;
    }, { isolationLevel: 'Serializable' });
  },
  async reschedulePatientAppointment(id, patientId, userId, newSlotId, request) {
    return prisma.$transaction(async (tx) => {
      const [appointment, newSlot] = await Promise.all([appointmentRepository.findById(id, tx), appointmentRepository.findSlot(newSlotId, tx)]);
      if (!appointment) throw new AppError('Appointment not found', 404);
      if (appointment.patientId !== patientId) throw new AppError('Not authorized', 403);
      if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) throw new AppError('This appointment cannot be rescheduled', 409);
      if (!newSlot || newSlot.date < new Date(new Date().toISOString().slice(0, 10))) throw new AppError('New appointment slot is not available', 409);
      assertSlotCapacity(newSlot);
      const card = appointment.patientCardId && await patientCardRepository.findById(appointment.patientCardId, tx);
      if (!card || card.verificationStatus !== 'VERIFIED' || card.hospitalId !== newSlot.hospitalId) throw new AppError('A verified card for the new hospital is required', 403);
      await validateAppointmentContext({ patientId, hospitalId: newSlot.hospitalId, departmentId: newSlot.departmentId, doctorId: newSlot.doctorId, patientCardId: card.id }, tx);
      const conflict = await appointmentRepository.findPatientConflict(patientId, newSlot.date, newSlot.startTime, newSlot.endTime, id, tx);
      if (conflict) throw new AppError('You already have a conflicting appointment', 409);
      const reserved = await appointmentRepository.reserveSlotOptimistically(newSlot, tx);
      if (reserved.count !== 1) throw new AppError('New slot was booked concurrently; choose another slot', 409);
      if (appointment.appointmentSlotId) await appointmentRepository.releaseSlot(appointment.appointmentSlotId, tx);
      const updated = await appointmentRepository.update(id, { hospitalId: newSlot.hospitalId, departmentId: newSlot.departmentId, doctorId: newSlot.doctorId, appointmentSlotId: newSlot.id, appointmentDate: newSlot.date, startTime: newSlot.startTime, endTime: newSlot.endTime, status: 'PENDING', cancelledAt: null, cancellationReason: null }, tx);
      await notificationService.create({ userId, hospitalId: newSlot.hospitalId, title: 'Appointment rescheduled', message: `Appointment ${appointment.appointmentNumber} was rescheduled.`, type: 'APPOINTMENT' }, tx);
      await auditService.record({ userId, hospitalId: newSlot.hospitalId, action: 'APPOINTMENT_RESCHEDULED', resourceType: 'Appointment', resourceId: id, request }, tx);
      return updated;
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 });
  },
};
