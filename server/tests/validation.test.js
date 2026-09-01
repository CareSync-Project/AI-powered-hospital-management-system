import { describe, expect, it } from 'vitest';
import { createHospitalSchema } from '../src/validators/hospitalValidators.js';
import { createDepartmentSchema } from '../src/validators/departmentValidators.js';
import { createPatientCardSchema, verifyPatientCardSchema } from '../src/validators/patientCardValidators.js';
import { createAppointmentSchema } from '../src/validators/appointmentValidators.js';

const uuid = '11111111-1111-4111-8111-111111111111';

describe('request validation', () => {
  it('accepts and normalizes a valid hospital', () => {
    const result = createHospitalSchema.parse({ name: 'Demo Hospital', hospitalCode: 'demo-1', address: '1 Test Road', city: 'Ho', region: 'Volta', country: 'Ghana', phone: '+233200000000', email: 'INFO@DEMO.INVALID' });
    expect(result.hospitalCode).toBe('DEMO-1');
    expect(result.email).toBe('info@demo.invalid');
  });

  it('rejects an invalid hospital creation request', () => {
    expect(createHospitalSchema.safeParse({ name: '', hospitalCode: 'bad code' }).success).toBe(false);
  });

  it('validates department input used before unique database constraints', () => {
    expect(createDepartmentSchema.safeParse({ name: 'ENT', code: 'ENT' }).success).toBe(true);
    expect(createDepartmentSchema.safeParse({ name: 'E', code: 'bad code' }).success).toBe(false);
  });

  it('validates patient card creation and rejection reasons', () => {
    expect(createPatientCardSchema.safeParse({ hospitalId: uuid, cardType: 'NHIS_CARD', cardNumber: 'NHIS-0001' }).success).toBe(true);
    expect(verifyPatientCardSchema.safeParse({ verificationStatus: 'REJECTED', verifiedByAdminId: uuid }).success).toBe(false);
  });

  it('validates appointment creation shape', () => {
    const result = createAppointmentSchema.safeParse({ patientId: uuid, hospitalId: uuid, departmentId: uuid, doctorId: uuid, appointmentDate: '2026-09-07', startTime: '09:00', endTime: '09:20', reasonForVisit: 'Routine review', bookingMethod: 'STAFF' });
    expect(result.success).toBe(true);
  });
});
