import prisma from '../config/prisma.js';

export const scheduleRepository = {
  findDepartmentSchedules: (departmentId, client = prisma) => client.departmentSchedule.findMany({ where: { departmentId }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }),
  findDoctorSchedules: (doctorId, client = prisma) => client.doctorSchedule.findMany({ where: { doctorId }, include: { department: true, hospital: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }),
  findDoctorConflict: (criteria, client = prisma) => client.doctorSchedule.findFirst({ where: criteria }),
  createDepartmentSchedule: (data, client = prisma) => client.departmentSchedule.create({ data }),
  createDoctorSchedule: (data, client = prisma) => client.doctorSchedule.create({ data }),
};
