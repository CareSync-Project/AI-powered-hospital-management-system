import { describe, expect, test, vi } from 'vitest';
import { appointmentFiltersForAuth, requireMatchingHospital } from '../src/services/authorizationService.js';
import { requirePatientOwnership } from '../src/middleware/authorization.js';
import { serializeAuthContext, serializeUser } from '../src/utils/serializers.js';
import { generateAccessToken, verifyAccessToken } from '../src/utils/tokens.js';
import { createVitalSchema } from '../src/validators/vitalValidators.js';

const profiles = {
  PATIENT: { role: 'PATIENT', user: { patientProfile: { id: 'patient-1' } } },
  DOCTOR: { role: 'DOCTOR', user: { doctorProfile: { id: 'doctor-1', hospitalAffiliations: [{ hospitalId: 'hospital-1', active: true }] } } },
  NURSE: { role: 'NURSE', user: { nurseProfile: { hospitalId: 'hospital-1' } } },
  ADMIN: { role: 'ADMIN', user: { adminProfile: { hospitalId: 'hospital-1' } } },
};

describe('authentication and RBAC security contracts', () => {
  test.each([
    ['PATIENT', { patientId: 'patient-1' }],
    ['DOCTOR', { doctorId: 'doctor-1' }],
    ['NURSE', { hospitalId: 'hospital-1' }],
    ['ADMIN', { hospitalId: 'hospital-1' }],
  ])('%s appointment listing is role-filtered', (role, expected) => {
    expect(appointmentFiltersForAuth(profiles[role])).toEqual(expected);
  });

  test('admin and nurse cannot cross hospital boundaries', () => {
    expect(() => requireMatchingHospital(profiles.ADMIN, 'hospital-2')).toThrow();
    expect(() => requireMatchingHospital(profiles.NURSE, 'hospital-2')).toThrow();
  });

  test('doctor hospital access requires an active affiliation', () => {
    expect(() => requireMatchingHospital(profiles.DOCTOR, 'hospital-1')).not.toThrow();
    expect(() => requireMatchingHospital(profiles.DOCTOR, 'hospital-2')).toThrow();
  });

  test('patient ownership middleware rejects another patient', () => {
    const next = vi.fn();
    requirePatientOwnership('patientId')({ auth: profiles.PATIENT, params: { patientId: 'patient-2' } }, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('patient vital public input cannot include trusted source fields', () => {
    const patientInput = createVitalSchema.omit({ source: true, verificationStatus: true, recordedByUserId: true });
    const parsed = patientInput.parse({ hospitalId: '550e8400-e29b-41d4-a716-446655440000', temperature: 37, source: 'NURSE', verificationStatus: 'VERIFIED', recordedByUserId: '550e8400-e29b-41d4-a716-446655440001' });
    expect(parsed.source).toBeUndefined();
    expect(parsed.verificationStatus).toBeUndefined();
    expect(parsed.recordedByUserId).toBeUndefined();
  });

  test('safe user serialization excludes passwordHash', () => {
    expect(serializeUser({ id: '1', email: 'safe@example.invalid', role: 'PATIENT', active: true, passwordHash: 'secret' })).not.toHaveProperty('passwordHash');
  });

  test('authentication context excludes internal password data', () => {
    const context = serializeAuthContext({ id: '1', email: 'safe@example.invalid', role: 'PATIENT', active: true, passwordHash: 'secret', patientProfile: { id: 'p1', hospitalRecords: [] } });
    expect(JSON.stringify(context)).not.toContain('secret');
  });

  test('access token contains only identity/session claims', () => {
    const token = generateAccessToken({ userId: 'user-1', role: 'PATIENT', sessionId: 'session-1' });
    const claims = verifyAccessToken(token);
    expect(claims).toMatchObject({ sub: 'user-1', role: 'PATIENT', sessionId: 'session-1' });
    expect(claims).not.toHaveProperty('passwordHash');
  });
});
