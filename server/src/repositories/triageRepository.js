import prisma from '../config/prisma.js';

export const triageRepository = {
  findByAppointment: (appointmentId, client = prisma) => client.triageRecord.findMany({ where: { appointmentId }, orderBy: { createdAt: 'desc' } }),
  create: (data, client = prisma) => client.triageRecord.create({ data }),
};
