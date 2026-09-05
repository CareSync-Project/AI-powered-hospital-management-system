import prisma from '../config/prisma.js';

export const scheduleRepository = {
  findDepartmentSchedules: (departmentId, client = prisma) => client.departmentSchedule.findMany({ where: { departmentId }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }),
  findDepartmentScheduleById: (id, client = prisma) => client.departmentSchedule.findUnique({ where: { id }, include: { department: true } }),
  findDepartmentConflicts: (data, excludeId, client = prisma) => client.departmentSchedule.findMany({ where: { departmentId: data.departmentId, dayOfWeek: data.dayOfWeek, active: true, ...(excludeId ? { id: { not: excludeId } } : {}), startTime: { lt: data.endTime }, endTime: { gt: data.startTime } } }),
  findDoctorSchedules: (doctorId, client = prisma) => client.doctorSchedule.findMany({ where: { doctorId }, select: { id: true, doctorId: true, departmentId: true, hospitalId: true, dayOfWeek: true, startTime: true, endTime: true, consultationDurationMinutes: true, maximumPatients: true, active: true, department: { select: { id: true, name: true, code: true } }, hospital: { select: { id: true, name: true } } }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }),
  findDoctorScheduleById: (id, client = prisma) => client.doctorSchedule.findUnique({ where: { id }, include: { department: true, doctor: true } }),
  findDoctorConflict: (criteria, client = prisma) => client.doctorSchedule.findFirst({ where: criteria }),
  createDepartmentSchedule: (data, client = prisma) => client.departmentSchedule.create({ data }),
  updateDepartmentSchedule: (id, data, client = prisma) => client.departmentSchedule.update({ where: { id }, data }),
  createDoctorSchedule: (data, client = prisma) => client.doctorSchedule.create({ data }),
  updateDoctorSchedule: (id, data, client = prisma) => client.doctorSchedule.update({ where: { id }, data, include: { department: true } }),
  findExceptions: (doctorId, from, client = prisma) => client.scheduleException.findMany({ where: { doctorId, ...(from ? { date: { gte: from } } : {}) }, orderBy: { date: 'asc' } }),
  findExceptionById: (id, client = prisma) => client.scheduleException.findUnique({ where: { id }, include: { doctor: true } }),
  createException: (data, client = prisma) => client.scheduleException.create({ data }),
  updateException: (id, data, client = prisma) => client.scheduleException.update({ where: { id }, data }),
  findSlots: (where, client = prisma) => client.appointmentSlot.findMany({ where, select: { id: true, hospitalId: true, doctorId: true, departmentId: true, date: true, startTime: true, endTime: true, capacity: true, bookedCount: true, status: true }, orderBy: { startTime: 'asc' } }),
};
