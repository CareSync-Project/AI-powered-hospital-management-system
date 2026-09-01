import prisma from '../config/prisma.js';

const doctorInclude = {
  user: { select: { id: true, email: true, active: true } },
  hospitalAffiliations: { include: { hospital: true } },
  departments: { include: { department: true, hospital: true } },
  schedules: { include: { department: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
  scheduleExceptions: { where: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: 'asc' } },
};

export const doctorRepository = {
  findPublicById: (id, client = prisma) => client.doctorProfile.findUnique({ where: { id, active: true }, select: { id: true, firstName: true, lastName: true, specialization: true, qualification: true, departments: { where: { active: true }, select: { primaryDepartment: true, department: { select: { id: true, name: true, code: true, hospitalId: true } } } }, schedules: { where: { active: true }, select: { id: true, hospitalId: true, departmentId: true, dayOfWeek: true, startTime: true, endTime: true } } } }),
  findPublicByHospital: (hospitalId, client = prisma) => client.doctorProfile.findMany({ where: { active: true, hospitalAffiliations: { some: { hospitalId, active: true } } }, select: { id: true, firstName: true, lastName: true, specialization: true, qualification: true, departments: { where: { hospitalId, active: true }, select: { primaryDepartment: true, department: { select: { id: true, name: true, code: true } } } } }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
  findById: (id, client = prisma) => client.doctorProfile.findUnique({ where: { id }, include: doctorInclude }),
  findByHospital: (hospitalId, client = prisma) => client.doctorProfile.findMany({
    where: { hospitalAffiliations: { some: { hospitalId, active: true } } },
    include: doctorInclude,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  }),
  findAffiliation: (doctorId, hospitalId, client = prisma) => client.doctorHospital.findUnique({
    where: { doctorId_hospitalId: { doctorId, hospitalId } },
  }),
  findDepartmentAssignment: (doctorId, departmentId, hospitalId, client = prisma) => client.doctorDepartment.findUnique({
    where: { doctorId_departmentId_hospitalId: { doctorId, departmentId, hospitalId } },
    include: { department: true },
  }),
  createAffiliation: (data, client = prisma) => client.doctorHospital.create({ data }),
  createDepartmentAssignment: (data, client = prisma) => client.doctorDepartment.create({ data }),
};
