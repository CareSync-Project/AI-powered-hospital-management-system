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
};
