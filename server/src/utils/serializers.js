import { maskCardNumber } from './card.js';

export const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  active: user.active,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const serializeCard = (card) => ({ ...card, cardNumber: maskCardNumber(card.cardNumber) });

export function serializeAuthContext(user) {
  const profile = user.patientProfile || user.doctorProfile || user.nurseProfile || user.adminProfile || null;
  let hospitalContext = [];
  if (user.adminProfile) hospitalContext = [{ hospitalId: user.adminProfile.hospitalId, type: 'ADMIN' }];
  if (user.nurseProfile) hospitalContext = [{ hospitalId: user.nurseProfile.hospitalId, type: 'NURSE' }];
  if (user.doctorProfile) hospitalContext = user.doctorProfile.hospitalAffiliations.map((item) => ({ hospitalId: item.hospitalId, type: 'DOCTOR', active: item.active }));
  if (user.patientProfile) hospitalContext = user.patientProfile.hospitalRecords.map((item) => ({ hospitalId: item.hospitalId, type: 'PATIENT', status: item.status }));
  return { user: serializeUser(user), profile, hospitalContext };
}
