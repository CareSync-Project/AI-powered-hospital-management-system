import { vitalRepository } from '../repositories/vitalRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { calculateBmi } from '../utils/bmi.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/prisma.js';

export const vitalService = {
  list: (patientId) => vitalRepository.findByPatient(patientId),
  async create(patientId, data) {
    const [patient, hospital] = await Promise.all([patientRepository.findById(patientId), hospitalRepository.findById(data.hospitalId)]);
    if (!patient) throw new AppError('Patient not found', 404);
    if (!hospital) throw new AppError('Hospital not found', 404);
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({ where: { id: data.appointmentId }, select: { patientId: true, hospitalId: true } });
      if (!appointment || appointment.patientId !== patientId || appointment.hospitalId !== data.hospitalId) throw new AppError('Appointment does not belong to this patient and hospital', 403);
    }
    const bmi = data.weight != null && data.height != null ? calculateBmi(data.weight, data.height) : null;
    return vitalRepository.create({
      ...data,
      patientId,
      bmi,
      verificationStatus: data.source === 'PATIENT' ? 'UNVERIFIED' : (data.verificationStatus || 'UNVERIFIED'),
    });
  },
};
