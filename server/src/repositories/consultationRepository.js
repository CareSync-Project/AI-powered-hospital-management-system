import prisma from '../config/prisma.js';

export const consultationRepository = {
  findByAppointment: (appointmentId, client = prisma) => client.consultation.findUnique({ where: { appointmentId } }),
  create: (data, client = prisma) => client.consultation.create({ data }),
};
