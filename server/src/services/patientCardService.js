import { patientCardRepository } from '../repositories/patientCardRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { sanitizePatientCard } from '../utils/card.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/prisma.js';
import { notificationService } from './notificationService.js';

export async function validateCardRelationship(patientId, hospitalId, repositories = { patientRepository, hospitalRepository }) {
  const [patient, hospital] = await Promise.all([
    repositories.patientRepository.findById(patientId),
    repositories.hospitalRepository.findById(hospitalId),
  ]);
  if (!patient) throw new AppError('Patient not found', 404);
  if (!hospital?.active) throw new AppError('Hospital not found or inactive', 404);
}

export const patientCardService = {
  async list(patientId) {
    const cards = await patientCardRepository.findByPatient(patientId);
    return cards.map(sanitizePatientCard);
  },
  async listPendingForHospital(hospitalId) {
    if (!hospitalId) throw new AppError('Administrator is not assigned to a hospital', 403);
    const cards = await patientCardRepository.findPendingByHospital(hospitalId);
    return cards.map(card => ({
      ...sanitizePatientCard(card),
      patient: {
        id: card.patient.id,
        firstName: card.patient.firstName,
        lastName: card.patient.lastName,
        phone: card.patient.phone,
        email: card.patient.user.email,
      },
    }));
  },
  async create(patientId, data) {
    await validateCardRelationship(patientId, data.hospitalId);
    const card = await patientCardRepository.create({
      ...data,
      patientId,
      expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T00:00:00.000Z`) : null,
      verificationStatus: 'PENDING',
    });
    return sanitizePatientCard(card);
  },
  async verify(id, data) {
    return prisma.$transaction(async (tx) => {
      const card = await patientCardRepository.findById(id, tx);
      if (!card) throw new AppError('Patient card not found', 404);
      const admin = await patientCardRepository.findAdminById(data.verifiedByAdminId, tx);
      if (!admin?.active || admin.hospitalId !== card.hospitalId) throw new AppError('Verifying administrator does not belong to the card hospital', 400);
      const updated = await patientCardRepository.updateVerification(id, {
        ...data,
        verifiedAt: data.verificationStatus === 'VERIFIED' ? new Date() : null,
        rejectionReason: data.verificationStatus === 'REJECTED' ? data.rejectionReason : null,
      }, tx);
      if (data.verificationStatus === 'VERIFIED') {
        await tx.patientHospitalRecord.upsert({
          where: { patientId_hospitalId: { patientId: card.patientId, hospitalId: card.hospitalId } },
          update: { status: 'ACTIVE' },
          create: { patientId: card.patientId, hospitalId: card.hospitalId, hospitalPatientNumber: `CARD-${card.patientId.slice(0, 8).toUpperCase()}`, status: 'ACTIVE' },
        });
      }
      await notificationService.create({
        userId: card.patient.userId,
        hospitalId: card.hospitalId,
        title: data.verificationStatus === 'VERIFIED' ? 'Card verified' : 'Card verification rejected',
        message: data.verificationStatus === 'VERIFIED'
          ? `Your ${card.cardType === 'NHIS_CARD' ? 'NHIS' : 'hospital'} card has been verified by ${card.hospital.name}.`
          : `Your card verification was rejected.${data.rejectionReason ? ` Reason: ${data.rejectionReason}` : ''}`,
        type: 'CARD_VERIFICATION',
      }, tx);
      return sanitizePatientCard(updated);
    });
  },
};
