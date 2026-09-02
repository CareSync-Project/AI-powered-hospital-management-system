import prisma from '../config/prisma.js';

export const hospitalRepository = {
  findPublic: (where = {}, client = prisma) => client.hospital.findMany({ where: { active: true, ...where }, select: { id: true, name: true, hospitalCode: true, city: true, region: true, country: true, phone: true, email: true, active: true }, orderBy: { name: 'asc' } }),
  findMany: (client = prisma) => client.hospital.findMany({ orderBy: { name: 'asc' } }),
  findById: (id, client = prisma) => client.hospital.findUnique({ where: { id } }),
  create: (data, client = prisma) => client.hospital.create({ data }),
  update: (id, data, client = prisma) => client.hospital.update({ where: { id }, data }),
};
