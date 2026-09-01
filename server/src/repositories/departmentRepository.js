import prisma from '../config/prisma.js';

export const departmentRepository = {
  findByHospital: (hospitalId, client = prisma) => client.department.findMany({ where: { hospitalId }, orderBy: { name: 'asc' } }),
  findById: (id, client = prisma) => client.department.findUnique({ where: { id } }),
  create: (data, client = prisma) => client.department.create({ data }),
  update: (id, data, client = prisma) => client.department.update({ where: { id }, data }),
};
