import prisma from '../config/prisma.js';

const appointmentInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, otherNames: true } },
  hospital: { select: { id: true, name: true, hospitalCode: true, city: true, region: true } },
  department: { select: { id: true, name: true, code: true } },
  doctor: { select: { id: true, firstName: true, lastName: true, specialization: true, qualification: true } },
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
  async releaseSlot(id, client = prisma) {
    const slot = await client.appointmentSlot.findUnique({ where: { id } });
    if (!slot || slot.bookedCount <= 0) return { count: 0 };
    return client.appointmentSlot.updateMany({
      where: { id, bookedCount: { gt: 0 } },
      data: { bookedCount: { decrement: 1 }, ...(slot.status === 'FULL' ? { status: 'AVAILABLE' } : {}) },
    });
  },
  update: (id, data, client = prisma) => client.appointment.update({ where: { id }, data, include: appointmentInclude }),
  findPatientConflict: (patientId, date, startTime, endTime, excludeId, client = prisma) => client.appointment.findFirst({ where: { patientId, appointmentDate: date, status: { notIn: ['CANCELLED', 'MISSED'] }, ...(excludeId ? { id: { not: excludeId } } : {}), startTime: { lt: endTime }, endTime: { gt: startTime } } }),
};
