import prisma from '../config/prisma.js';

const doctorInclude = {
  user: { select: { id: true, email: true, active: true } },
  hospitalAffiliations: { include: { hospital: true } },
  departments: { include: { department: true, hospital: true } },
};

export const doctorRepository = {
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
