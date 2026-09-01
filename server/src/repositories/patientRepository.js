import prisma from '../config/prisma.js';

const patientInclude = {
  user: { select: { id: true, email: true, active: true, emailVerified: true } },
  hospitalRecords: { include: { hospital: true } },
};

export const patientRepository = {
  findById: (id, client = prisma) => client.patientProfile.findUnique({ where: { id }, include: patientInclude }),
};
