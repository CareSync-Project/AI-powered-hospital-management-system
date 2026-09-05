import { scheduleRepository } from '../repositories/scheduleRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { validateDoctorDepartmentContext } from './doctorService.js';
import { AppError } from '../middleware/errorHandler.js';
import { timeToDate, validateTimeRange } from '../utils/time.js';
import prisma from '../config/prisma.js';
import { emailService } from './emailService.js';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const minutes = (value) => value.getUTCHours() * 60 + value.getUTCMinutes();
const timeAt = (value) => new Date(Date.UTC(1970, 0, 1, Math.floor(value / 60), value % 60));
const dateAt = (value) => new Date(`${value}T00:00:00.000Z`);
const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'TRIAGED', 'WAITING', 'IN_CONSULTATION'];

export function appointmentAffectedByException(appointment, exception) {
  if (['LEAVE', 'HOLIDAY'].includes(exception.exceptionType)) return true;
  if (exception.exceptionType === 'UNAVAILABLE') {
    if (!exception.startTime || !exception.endTime) return true;
    return minutes(appointment.startTime) < minutes(exception.endTime)
      && minutes(appointment.endTime) > minutes(exception.startTime);
  }
  if (exception.exceptionType === 'CUSTOM_HOURS') {
    return minutes(appointment.startTime) < minutes(exception.startTime)
      || minutes(appointment.endTime) > minutes(exception.endTime);
  }
  return false;
}

const formatDate = (date) => new Intl.DateTimeFormat('en-GH', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
const formatTime = (date) => new Intl.DateTimeFormat('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(date);

function exceptionMessage(appointment, exception, doctorName) {
  const period = exception.startTime && exception.endTime
    ? ` between ${formatTime(exception.startTime)} and ${formatTime(exception.endTime)}`
    : '';
  const reason = exception.reason ? ` Reason: ${exception.reason}` : '';
  return `Dr. ${doctorName} is unavailable on ${formatDate(exception.date)}${period}. Your appointment ${appointment.appointmentNumber} is affected. Please contact CareSync or check your appointments for rescheduling.${reason}`;
}

async function sendScheduleExceptionEmails(recipients, hospitalName) {
  await Promise.all(recipients.map(({ email, name, message }) => emailService.send({
    to: email,
    subject: 'Important update about your CareSync appointment',
    text: message,
    html: emailService.announcementHtml({
      title: 'Doctor availability update',
      message,
      hospitalName,
    }).replace('{{NAME}}', name),
  })));
}

export function assertValidScheduleRange(startTime, endTime) {
  if (!validateTimeRange(startTime, endTime)) throw new AppError('Schedule start time must be before end time', 400);
}

export function assertNoScheduleConflict(conflict) {
  if (conflict) throw new AppError('Doctor schedule conflicts with an existing schedule', 409);
}

export const hasDepartmentScheduleConflict = (items) => items.length > 0;
export const hasDoctorScheduleConflict = (item) => Boolean(item);
export const isDoctorScheduleWithinDepartmentHours = (doctor, departments) => departments.some((item) => item.active && minutes(item.startTime) <= minutes(doctor.startTime) && minutes(item.endTime) >= minutes(doctor.endTime));

export function buildSlotCandidates(schedules, exceptions = []) {
  if (exceptions.some((item) => ['LEAVE', 'HOLIDAY', 'UNAVAILABLE'].includes(item.exceptionType) && !item.startTime)) return [];
  const custom = exceptions.find((item) => item.exceptionType === 'CUSTOM_HOURS');
  const unavailable = exceptions.filter((item) => item.exceptionType === 'UNAVAILABLE' && item.startTime && item.endTime);
  const candidates = [];
  for (const schedule of schedules) {
    let start = minutes(schedule.startTime); let end = minutes(schedule.endTime); let count = 0;
    if (custom) { start = Math.max(start, minutes(custom.startTime)); end = Math.min(end, minutes(custom.endTime)); }
    for (let cursor = start; cursor + schedule.consultationDurationMinutes <= end && count < schedule.maximumPatients; cursor += schedule.consultationDurationMinutes) {
      const finish = cursor + schedule.consultationDurationMinutes;
      if (!unavailable.some((item) => cursor < minutes(item.endTime) && finish > minutes(item.startTime))) { candidates.push({ schedule, startTime: timeAt(cursor), endTime: timeAt(finish) }); count += 1; }
    }
  }
  return candidates;
}

export const scheduleService = {
  listDepartment: (departmentId) => scheduleRepository.findDepartmentSchedules(departmentId),
  listDoctor: (doctorId) => scheduleRepository.findDoctorSchedules(doctorId),
  async createDepartment(data) {
    assertValidScheduleRange(data.startTime, data.endTime);
    const department = await departmentRepository.findById(data.departmentId);
    if (!department || department.hospitalId !== data.hospitalId) throw new AppError('Department does not belong to the hospital', 400);
    const converted = { ...data, startTime: timeToDate(data.startTime), endTime: timeToDate(data.endTime) };
    if (hasDepartmentScheduleConflict(await scheduleRepository.findDepartmentConflicts(converted))) throw new AppError('Department schedule overlaps an existing schedule', 409);
    return scheduleRepository.createDepartmentSchedule(converted);
  },
  async updateDepartment(id, data, authorizedHospitalId) {
    const current = await scheduleRepository.findDepartmentScheduleById(id);
    if (!current) throw new AppError('Department schedule not found', 404);
    if (authorizedHospitalId && current.hospitalId !== authorizedHospitalId) throw new AppError('Not authorized', 403);
    const merged = { ...current, ...data, startTime: data.startTime ? timeToDate(data.startTime) : current.startTime, endTime: data.endTime ? timeToDate(data.endTime) : current.endTime };
    if (minutes(merged.startTime) >= minutes(merged.endTime)) throw new AppError('Schedule start time must be before end time', 400);
    if (merged.active && hasDepartmentScheduleConflict(await scheduleRepository.findDepartmentConflicts(merged, id))) throw new AppError('Department schedule overlaps an existing schedule', 409);
    return scheduleRepository.updateDepartmentSchedule(id, { ...data, ...(data.startTime ? { startTime: merged.startTime } : {}), ...(data.endTime ? { endTime: merged.endTime } : {}) });
  },
  async createDoctor(data) {
    assertValidScheduleRange(data.startTime, data.endTime);
    await validateDoctorDepartmentContext(data.doctorId, data.departmentId, data.hospitalId);
    const startTime = timeToDate(data.startTime);
    const endTime = timeToDate(data.endTime);
    const conflict = await scheduleRepository.findDoctorConflict({
      doctorId: data.doctorId,
      dayOfWeek: data.dayOfWeek,
      active: true,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    });
    assertNoScheduleConflict(conflict);
    const departmentHours = await scheduleRepository.findDepartmentSchedules(data.departmentId);
    if (!isDoctorScheduleWithinDepartmentHours({ ...data, startTime, endTime }, departmentHours.filter((item) => item.dayOfWeek === data.dayOfWeek))) throw new AppError('Doctor schedule must fit inside active department operating hours', 400);
    return scheduleRepository.createDoctorSchedule({ ...data, startTime, endTime });
  },
  async updateDoctor(id, data, authorizedHospitalId) {
    const current = await scheduleRepository.findDoctorScheduleById(id);
    if (!current) throw new AppError('Doctor schedule not found', 404);
    if (authorizedHospitalId && current.hospitalId !== authorizedHospitalId) throw new AppError('Not authorized', 403);
    const merged = { ...current, ...data, startTime: data.startTime ? timeToDate(data.startTime) : current.startTime, endTime: data.endTime ? timeToDate(data.endTime) : current.endTime };
    await validateDoctorDepartmentContext(current.doctorId, merged.departmentId, current.hospitalId);
    if (minutes(merged.startTime) >= minutes(merged.endTime)) throw new AppError('Schedule start time must be before end time', 400);
    const conflict = await scheduleRepository.findDoctorConflict({ doctorId: current.doctorId, dayOfWeek: merged.dayOfWeek, active: true, id: { not: id }, startTime: { lt: merged.endTime }, endTime: { gt: merged.startTime } });
    assertNoScheduleConflict(conflict);
    const departmentHours = await scheduleRepository.findDepartmentSchedules(merged.departmentId);
    if (!isDoctorScheduleWithinDepartmentHours(merged, departmentHours.filter((item) => item.dayOfWeek === merged.dayOfWeek))) throw new AppError('Doctor schedule must fit inside active department operating hours', 400);
    return scheduleRepository.updateDoctorSchedule(id, { ...data, ...(data.startTime ? { startTime: merged.startTime } : {}), ...(data.endTime ? { endTime: merged.endTime } : {}) });
  },
  async listExceptions(doctorId, from, authorizedHospitalId) {
    if (authorizedHospitalId) {
      const affiliation = await prisma.doctorHospital.findUnique({ where: { doctorId_hospitalId: { doctorId, hospitalId: authorizedHospitalId } } });
      if (!affiliation) throw new AppError('Doctor does not belong to this hospital', 403);
    }
    return scheduleRepository.findExceptions(doctorId, from ? dateAt(from) : undefined);
  },
  async createException(doctorId, hospitalId, data) {
    const affiliation = await prisma.doctorHospital.findUnique({ where: { doctorId_hospitalId: { doctorId, hospitalId } } });
    if (!affiliation?.active) throw new AppError('Doctor is not affiliated with this hospital', 403);
    const converted = { doctorId, hospitalId, date: dateAt(data.date), exceptionType: data.exceptionType, reason: data.reason || null, startTime: data.startTime ? timeToDate(data.startTime) : null, endTime: data.endTime ? timeToDate(data.endTime) : null };
    const result = await prisma.$transaction(async (tx) => {
      const [doctor, hospital, appointments] = await Promise.all([
        tx.doctorProfile.findUnique({ where: { id: doctorId }, select: { firstName: true, lastName: true } }),
        tx.hospital.findUnique({ where: { id: hospitalId }, select: { name: true } }),
        tx.appointment.findMany({
          where: { doctorId, hospitalId, appointmentDate: converted.date, status: { in: ACTIVE_APPOINTMENT_STATUSES } },
          include: { patient: { select: { firstName: true, lastName: true, user: { select: { id: true, email: true, active: true } } } } },
        }),
      ]);
      const affected = appointments.filter((appointment) => appointmentAffectedByException(appointment, converted));
      const exception = await scheduleRepository.createException(converted, tx);
      const doctorName = [doctor?.firstName, doctor?.lastName].filter(Boolean).join(' ') || 'your doctor';
      const deliveries = affected.filter((appointment) => appointment.patient.user.active).map((appointment) => ({
        userId: appointment.patient.user.id,
        email: appointment.patient.user.email,
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
        message: exceptionMessage(appointment, converted, doctorName),
      }));
      if (deliveries.length) await tx.notification.createMany({ data: deliveries.map(({ userId, message }) => ({ userId, hospitalId, title: 'Doctor availability update', message, type: 'SCHEDULE' })) });
      return { exception, bookedSlotConflicts: affected.length, notifiedPatients: deliveries.length, deliveries, hospitalName: hospital?.name || 'CareSync Hospital' };
    });
    await sendScheduleExceptionEmails(result.deliveries, result.hospitalName);
    const { deliveries, hospitalName, ...response } = result;
    return response;
  },
  async updateException(id, data, authorizedHospitalId) {
    const current = await scheduleRepository.findExceptionById(id);
    if (!current) throw new AppError('Schedule exception not found', 404);
    if (authorizedHospitalId && current.hospitalId !== authorizedHospitalId) throw new AppError('Not authorized', 403);
    return scheduleRepository.updateException(id, { ...data, ...(data.date ? { date: dateAt(data.date) } : {}), ...(data.startTime !== undefined ? { startTime: data.startTime ? timeToDate(data.startTime) : null } : {}), ...(data.endTime !== undefined ? { endTime: data.endTime ? timeToDate(data.endTime) : null } : {}) });
  },
};

export const appointmentSlotService = {
  async generate(doctorId, departmentId, dateString, authorizedHospitalId) {
    const date = dateAt(dateString);
    if (date < dateAt(new Date().toISOString().slice(0, 10))) throw new AppError('Past slots cannot be generated', 400);
    const dayOfWeek = DAYS[date.getUTCDay()];
    const schedules = await prisma.doctorSchedule.findMany({ where: { doctorId, departmentId, dayOfWeek, active: true, ...(authorizedHospitalId ? { hospitalId: authorizedHospitalId } : {}) }, include: { department: true } });
    if (!schedules.length) return { generated: 0, preservedBooked: 0, conflicts: [], slots: [] };
    const exceptions = await prisma.scheduleException.findMany({ where: { doctorId, date } });
    if (exceptions.some((item) => ['LEAVE', 'HOLIDAY', 'UNAVAILABLE'].includes(item.exceptionType) && !item.startTime)) {
      const preservedBooked = await prisma.appointmentSlot.count({ where: { doctorId, date, bookedCount: { gt: 0 } } });
      await prisma.appointmentSlot.updateMany({ where: { doctorId, date, bookedCount: 0 }, data: { status: 'BLOCKED' } });
      return { generated: 0, preservedBooked, conflicts: preservedBooked ? ['Existing booked slots require administrator review'] : [], slots: [] };
    }
    const candidates = buildSlotCandidates(schedules, exceptions).map(({ schedule, startTime, endTime }) => ({ hospitalId: schedule.hospitalId, departmentId, doctorId, date, startTime, endTime, capacity: 1 }));
    return prisma.$transaction(async (tx) => {
      const existing = await tx.appointmentSlot.findMany({ where: { doctorId, date } });
      const keys = new Set(candidates.map((item) => `${minutes(item.startTime)}-${minutes(item.endTime)}`));
      const retainedIds = existing.filter((item) => keys.has(`${minutes(item.startTime)}-${minutes(item.endTime)}`)).map((item) => item.id);
      await tx.appointmentSlot.updateMany({ where: { doctorId, date, bookedCount: 0, ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}) }, data: { status: 'CLOSED' } });
      const result = await tx.appointmentSlot.createMany({ data: candidates, skipDuplicates: true });
      const slots = await scheduleRepository.findSlots({ doctorId, departmentId, date, status: { in: ['AVAILABLE', 'FULL'] } }, tx);
      return { generated: result.count, preservedBooked: existing.filter((item) => item.bookedCount > 0).length, conflicts: [], slots };
    });
  },
  async listDoctor(doctorId, date) { return (await scheduleRepository.findSlots({ doctorId, date: dateAt(date), status: 'AVAILABLE' })).filter((slot) => slot.bookedCount < slot.capacity); },
  async listDepartment(departmentId, date) { return (await scheduleRepository.findSlots({ departmentId, date: dateAt(date), status: 'AVAILABLE' })).filter((slot) => slot.bookedCount < slot.capacity); },
};
