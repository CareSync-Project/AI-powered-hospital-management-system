import { describe, expect, test } from 'vitest';
import { appointmentAffectedByException, assertValidScheduleRange, buildSlotCandidates, hasDepartmentScheduleConflict, hasDoctorScheduleConflict, isDoctorScheduleWithinDepartmentHours } from '../src/services/scheduleService.js';
import { departmentScheduleSchema, doctorScheduleSchema, scheduleExceptionSchema, generateSlotsSchema, slotDateQuerySchema, updateDepartmentScheduleSchema, updateDoctorScheduleSchema } from '../src/validators/scheduleValidators.js';
import { createDoctorAccountSchema, updateDoctorProfileSchema } from '../src/validators/staffValidators.js';
import { requireMatchingHospital } from '../src/services/authorizationService.js';

const at = (hour, minute = 0) => new Date(Date.UTC(1970, 0, 1, hour, minute));
const base = { hospitalId: '550e8400-e29b-41d4-a716-446655440000', departmentId: '550e8400-e29b-41d4-a716-446655440001', doctorId: '550e8400-e29b-41d4-a716-446655440002' };
const work = { ...base, startTime: at(9), endTime: at(12), consultationDurationMinutes: 30, maximumPatients: 20 };

describe('Phase 4 scheduling engine', () => {
  test('valid department schedule is accepted', () => expect(departmentScheduleSchema.safeParse({ ...base, dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '14:00', dailyCapacity: 30 }).success).toBe(true));
  test('invalid department capacity is rejected', () => expect(departmentScheduleSchema.safeParse({ ...base, dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '14:00', dailyCapacity: 0 }).success).toBe(false));
  test('invalid doctor consultation duration is rejected', () => expect(doctorScheduleSchema.safeParse({ ...base, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '12:00', consultationDurationMinutes: 0, maximumPatients: 10 }).success).toBe(false));
  test('department conflict helper detects overlaps', () => expect(hasDepartmentScheduleConflict([{ id: 'overlap' }])).toBe(true));
  test('doctor conflict helper detects overlaps', () => expect(hasDoctorScheduleConflict({ id: 'overlap' })).toBe(true));
  test('doctor schedule must fit department hours', () => {
    expect(isDoctorScheduleWithinDepartmentHours(work, [{ active: true, startTime: at(8), endTime: at(14) }])).toBe(true);
    expect(isDoctorScheduleWithinDepartmentHours({ ...work, startTime: at(6) }, [{ active: true, startTime: at(8), endTime: at(14) }])).toBe(false);
  });
  test('slot duration calculation produces deterministic earliest slots', () => expect(buildSlotCandidates([work]).map(x => x.startTime.toISOString().slice(11,16))).toEqual(['09:00','09:30','10:00','10:30','11:00','11:30']));
  test('maximum patient count limits generated slots', () => expect(buildSlotCandidates([{ ...work, maximumPatients: 2 }])).toHaveLength(2));
  test.each(['LEAVE','HOLIDAY','UNAVAILABLE'])('%s suppresses an entire date', (exceptionType) => expect(buildSlotCandidates([work], [{ exceptionType, startTime: null, endTime: null }])).toHaveLength(0));
  test('partial unavailable period suppresses intersecting slots', () => expect(buildSlotCandidates([work], [{ exceptionType:'UNAVAILABLE', startTime:at(10), endTime:at(11) }]).map(x=>x.startTime.toISOString().slice(11,16))).toEqual(['09:00','09:30','11:00','11:30']));
  test('custom hours constrain slot generation', () => expect(buildSlotCandidates([work], [{ exceptionType:'CUSTOM_HOURS', startTime:at(10), endTime:at(11) }])).toHaveLength(2));
  test('custom hours require both times', () => expect(scheduleExceptionSchema.safeParse({ date:'2026-09-15', exceptionType:'CUSTOM_HOURS', startTime:'10:00' }).success).toBe(false));
  test('equal schedule times are rejected by the business rule', () => expect(() => assertValidScheduleRange('08:00','08:00')).toThrow());
  test('reversed schedule times are rejected by the business rule', () => expect(() => assertValidScheduleRange('14:00','08:00')).toThrow());
  test('invalid day of week is rejected', () => expect(departmentScheduleSchema.safeParse({ ...base, dayOfWeek:'FUNDAY', startTime:'08:00', endTime:'12:00', dailyCapacity:10 }).success).toBe(false));
  test('empty department schedule update is rejected', () => expect(updateDepartmentScheduleSchema.safeParse({}).success).toBe(false));
  test('department schedule can be soft-deactivated', () => expect(updateDepartmentScheduleSchema.safeParse({active:false}).success).toBe(true));
  test('empty doctor schedule update is rejected', () => expect(updateDoctorScheduleSchema.safeParse({}).success).toBe(false));
  test('doctor schedule can be soft-deactivated', () => expect(updateDoctorScheduleSchema.safeParse({active:false}).success).toBe(true));
  test('slot generation requires a valid date and department', () => expect(generateSlotsSchema.safeParse({departmentId:base.departmentId,date:'2026-09-10'}).success).toBe(true));
  test('slot discovery rejects ambiguous date formats', () => expect(slotDateQuerySchema.safeParse({date:'09/10/2026'}).success).toBe(false));
  test('doctor creation cannot inject a hospital or role', () => {
    const result=createDoctorAccountSchema.safeParse({email:'doctor@example.invalid',password:'StrongPass123',firstName:'Test',lastName:'Doctor',phone:'+233200000000',employeeNumber:'E1',licenseNumber:'L1',specialization:'General',qualification:'MBChB',startedAt:'2026-01-01',hospitalId:base.hospitalId,role:'ADMIN'});
    expect(result.success).toBe(false);
  });
  test('doctor safe update cannot change role or hospital', () => expect(updateDoctorProfileSchema.safeParse({role:'ADMIN',hospitalId:base.hospitalId}).success).toBe(false));
  test('admin hospital scope accepts own hospital', () => expect(()=>requireMatchingHospital({role:'ADMIN',user:{adminProfile:{hospitalId:base.hospitalId}}},base.hospitalId)).not.toThrow());
  test('admin hospital scope rejects another hospital', () => expect(()=>requireMatchingHospital({role:'ADMIN',user:{adminProfile:{hospitalId:base.hospitalId}}},'other')).toThrow());
  test('inactive department hours do not authorize doctor schedules', () => expect(isDoctorScheduleWithinDepartmentHours(work,[{active:false,startTime:at(8),endTime:at(14)}])).toBe(false));
  test('slot capacity defaults are represented as one per generated candidate', () => expect(buildSlotCandidates([work]).every(item=>item.schedule===work)).toBe(true));
  test('non-overlapping sessions are not reported as conflicts', () => expect(hasDepartmentScheduleConflict([])).toBe(false));
  test('partial doctor unavailability affects only overlapping appointments', () => {
    const exception = { exceptionType: 'UNAVAILABLE', startTime: at(10), endTime: at(11) };
    expect(appointmentAffectedByException({ startTime: at(9), endTime: at(10) }, exception)).toBe(false);
    expect(appointmentAffectedByException({ startTime: at(10, 30), endTime: at(11) }, exception)).toBe(true);
  });
  test.each(['LEAVE', 'HOLIDAY'])('%s affects every appointment that day', (exceptionType) => expect(appointmentAffectedByException({ startTime: at(9), endTime: at(10) }, { exceptionType })).toBe(true));
  test('custom hours affect appointments outside the replacement period', () => {
    const exception = { exceptionType: 'CUSTOM_HOURS', startTime: at(10), endTime: at(14) };
    expect(appointmentAffectedByException({ startTime: at(10), endTime: at(11) }, exception)).toBe(false);
    expect(appointmentAffectedByException({ startTime: at(9), endTime: at(10) }, exception)).toBe(true);
  });
});
