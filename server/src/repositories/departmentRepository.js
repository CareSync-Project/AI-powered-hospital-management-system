import prisma from '../config/prisma.js';

export const departmentRepository = {
  findByHospital: (hospitalId, client = prisma) => client.department.findMany({ where: { hospitalId }, orderBy: { name: 'asc' } }),
  findManagementByHospital: (hospitalId, client = prisma) => client.department.findMany({ where: { hospitalId }, include: { schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }, doctorDepartments: { where: { active: true }, select: { id: true } } }, orderBy: { name: 'asc' } }),
  findById: (id, client = prisma) => client.department.findUnique({ where: { id } }),
  create: (data, client = prisma) => client.department.create({ data }),
  update: (id, data, client = prisma) => client.department.update({ where: { id }, data }),
};
