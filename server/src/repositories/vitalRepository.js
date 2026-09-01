import prisma from '../config/prisma.js';

export const vitalRepository = {
  findByPatient: (patientId, client = prisma) => client.vitalRecord.findMany({ where: { patientId }, orderBy: { recordedAt: 'desc' } }),
  create: (data, client = prisma) => client.vitalRecord.create({ data }),
};
