import prisma from '../config/prisma.js';

export const hospitalRepository = {
  findMany: (client = prisma) => client.hospital.findMany({ orderBy: { name: 'asc' } }),
  findById: (id, client = prisma) => client.hospital.findUnique({ where: { id } }),
  create: (data, client = prisma) => client.hospital.create({ data }),
  update: (id, data, client = prisma) => client.hospital.update({ where: { id }, data }),
};
