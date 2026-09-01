import { patientCardRepository } from '../repositories/patientCardRepository.js';
import { patientRepository } from '../repositories/patientRepository.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { sanitizePatientCard } from '../utils/card.js';
import { AppError } from '../middleware/errorHandler.js';

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
    const card = await patientCardRepository.findById(id);
    if (!card) throw new AppError('Patient card not found', 404);
    const admin = await patientCardRepository.findAdminById(data.verifiedByAdminId);
    if (!admin?.active || admin.hospitalId !== card.hospitalId) throw new AppError('Verifying administrator does not belong to the card hospital', 400);
    const updated = await patientCardRepository.updateVerification(id, {
      ...data,
      verifiedAt: data.verificationStatus === 'VERIFIED' ? new Date() : null,
      rejectionReason: data.verificationStatus === 'REJECTED' ? data.rejectionReason : null,
    });
    return sanitizePatientCard(updated);
  },
};
