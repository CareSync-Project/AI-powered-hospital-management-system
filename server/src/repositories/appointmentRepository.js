import prisma from '../config/prisma.js';

const appointmentInclude = {
  patient: true,
  hospital: true,
  department: true,
  doctor: true,
  appointmentSlot: true,
};

export const appointmentRepository = {
  findMany: (filters = {}, client = prisma) => client.appointment.findMany({ where: filters, include: appointmentInclude, orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }] }),
  findById: (id, client = prisma) => client.appointment.findUnique({ where: { id }, include: appointmentInclude }),
  create: (data, client = prisma) => client.appointment.create({ data, include: appointmentInclude }),
  findSlot: (id, client = prisma) => client.appointmentSlot.findUnique({ where: { id } }),
  reserveSlotOptimistically: (slot, client = prisma) => client.appointmentSlot.updateMany({
    where: { id: slot.id, bookedCount: slot.bookedCount, status: 'AVAILABLE' },
    data: {
      bookedCount: { increment: 1 },
      ...(slot.bookedCount + 1 >= slot.capacity ? { status: 'FULL' } : {}),
    },
  }),
  releaseSlot: (id, client = prisma) => client.appointmentSlot.updateMany({ where: { id, bookedCount: { gt: 0 } }, data: { bookedCount: { decrement: 1 }, status: 'AVAILABLE' } }),
  update: (id, data, client = prisma) => client.appointment.update({ where: { id }, data, include: appointmentInclude }),
  findPatientConflict: (patientId, date, startTime, endTime, excludeId, client = prisma) => client.appointment.findFirst({ where: { patientId, appointmentDate: date, status: { notIn: ['CANCELLED', 'MISSED'] }, ...(excludeId ? { id: { not: excludeId } } : {}), startTime: { lt: endTime }, endTime: { gt: startTime } } }),
};
