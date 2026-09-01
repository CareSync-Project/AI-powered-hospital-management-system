import { scheduleRepository } from '../repositories/scheduleRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { validateDoctorDepartmentContext } from './doctorService.js';
import { AppError } from '../middleware/errorHandler.js';
import { timeToDate, validateTimeRange } from '../utils/time.js';

export function assertValidScheduleRange(startTime, endTime) {
  if (!validateTimeRange(startTime, endTime)) throw new AppError('Schedule start time must be before end time', 400);
}

export function assertNoScheduleConflict(conflict) {
  if (conflict) throw new AppError('Doctor schedule conflicts with an existing schedule', 409);
}

export const scheduleService = {
  listDepartment: (departmentId) => scheduleRepository.findDepartmentSchedules(departmentId),
  listDoctor: (doctorId) => scheduleRepository.findDoctorSchedules(doctorId),
  async createDepartment(data) {
    assertValidScheduleRange(data.startTime, data.endTime);
    const department = await departmentRepository.findById(data.departmentId);
    if (!department || department.hospitalId !== data.hospitalId) throw new AppError('Department does not belong to the hospital', 400);
    return scheduleRepository.createDepartmentSchedule({ ...data, startTime: timeToDate(data.startTime), endTime: timeToDate(data.endTime) });
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
    return scheduleRepository.createDoctorSchedule({ ...data, startTime, endTime });
  },
};
