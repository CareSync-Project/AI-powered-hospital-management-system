import prisma from '../config/prisma.js';

export const nurseRepository = {
  findById: (id, client = prisma) => client.nurseProfile.findUnique({ where: { id }, include: { hospital: true, user: { select: { id: true, email: true, active: true } } } }),
};
