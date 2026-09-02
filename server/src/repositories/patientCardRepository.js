import prisma from '../config/prisma.js';

export const patientCardRepository = {
  findById: (id, client = prisma) => client.patientCard.findUnique({ where: { id }, include: { hospital: { select: { id: true, name: true } }, patient: { select: { id: true, userId: true } } } }),
  findByPatient: (patientId, client = prisma) => client.patientCard.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
  create: (data, client = prisma) => client.patientCard.create({ data }),
  updateVerification: (id, data, client = prisma) => client.patientCard.update({ where: { id }, data }),
  findAdminById: (id, client = prisma) => client.adminProfile.findUnique({ where: { id } }),
};
