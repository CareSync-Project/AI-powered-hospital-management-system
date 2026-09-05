import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { appointmentSlotService } from './scheduleService.js';

export const appointmentRecommendationService = {
  async recommend({ hospitalId, departmentId, date }) {
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    if (targetDate < new Date(new Date().toISOString().slice(0, 10))) throw new AppError('Past dates are not available', 400);
    await appointmentSlotService.ensureDepartment(departmentId, date, hospitalId);
    const slots = await prisma.appointmentSlot.findMany({ where: { hospitalId, departmentId, date: targetDate, status: 'AVAILABLE' }, include: { doctor: { select: { id: true, firstName: true, lastName: true, specialization: true, active: true } }, department: { select: { id: true, name: true } } }, orderBy: [{ startTime: 'asc' }, { bookedCount: 'asc' }] });
    const eligible = slots.filter((slot) => slot.doctor.active && slot.bookedCount < slot.capacity);
    if (!eligible.length) throw new AppError('No appointments are available for this date', 404);
    const [recommended, ...alternatives] = eligible;
    return { recommendedDoctor: recommended.doctor, recommendedSlot: recommended, reason: `Recommended because this is the earliest available ${recommended.department.name} appointment on the selected date.`, alternatives: alternatives.slice(0, 5) };
  },
};
