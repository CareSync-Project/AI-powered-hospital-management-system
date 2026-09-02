import { describe, expect, it, vi } from 'vitest';
import { calculateBmi } from '../src/utils/bmi.js';
import { maskCardNumber } from '../src/utils/card.js';
import { assertNoScheduleConflict, assertValidScheduleRange } from '../src/services/scheduleService.js';
import { validateDoctorDepartmentContext } from '../src/services/doctorService.js';
import { validateCardRelationship } from '../src/services/patientCardService.js';
import { assertSlotCapacity, assertSlotMatchesAppointment, createAppointmentNumber } from '../src/services/appointmentService.js';

describe('business rules', () => {
  it('requires schedule start before end', () => {
    expect(() => assertValidScheduleRange('08:00', '16:00')).not.toThrow();
    expect(() => assertValidScheduleRange('16:00', '08:00')).toThrow(/before end/);
  });

  it('rejects duplicate/overlapping doctor schedules', () => {
    expect(() => assertNoScheduleConflict({ id: 'existing' })).toThrow(/conflicts/);
    expect(() => assertNoScheduleConflict(null)).not.toThrow();
  });

  it('rejects a doctor assigned across the wrong hospital or department', async () => {
    const repositories = {
      doctorRepository: { findAffiliation: vi.fn().mockResolvedValue({ active: true }), findDepartmentAssignment: vi.fn().mockResolvedValue({ active: true }) },
      departmentRepository: { findById: vi.fn().mockResolvedValue({ hospitalId: 'hospital-b' }) },
    };
    await expect(validateDoctorDepartmentContext('doctor', 'department', 'hospital-a', repositories)).rejects.toThrow(/does not belong/);
  });

  it('validates patient/card hospital relationships', async () => {
    const repositories = {
      patientRepository: { findById: vi.fn().mockResolvedValue({ id: 'patient' }) },
      hospitalRepository: { findById: vi.fn().mockResolvedValue({ id: 'hospital', active: true }) },
    };
    await expect(validateCardRelationship('patient', 'hospital', repositories)).resolves.toBeUndefined();
  });

  it('enforces appointment slot capacity and context', () => {
    expect(() => assertSlotCapacity({ capacity: 1, bookedCount: 1, status: 'AVAILABLE' })).toThrow(/capacity/);
    const slot = { capacity: 2, bookedCount: 0, status: 'AVAILABLE', hospitalId: 'h1', departmentId: 'd1', doctorId: 'doc1', date: new Date('2026-09-07T00:00:00Z') };
    expect(() => assertSlotCapacity(slot)).not.toThrow();
    expect(() => assertSlotMatchesAppointment(slot, { hospitalId: 'h2', departmentId: 'd1', doctorId: 'doc1', appointmentDate: '2026-09-07' })).toThrow(/does not match/);
  });

  it('creates human-readable unique-style appointment numbers', () => {
    expect(createAppointmentNumber(new Date('2026-01-01T00:00:00Z'), () => '12345678-abcd-4abc-8abc-123456789000')).toBe('APT-2026-12345678');
  });

  it('calculates BMI from kilograms and centimetres', () => {
    expect(calculateBmi(70, 175)).toBe(22.86);
    expect(() => calculateBmi(70, 0)).toThrow(/positive/);
  });

  it('masks patient card numbers in API responses', () => {
    expect(maskCardNumber('NHIS-DEMO-1234')).toBe('********1234');
  });
});
