import { AppError } from './errorHandler.js';
import { getPatientProfileId, requireMatchingHospital, requireDepartmentHospital, requirePatientAccess, requireAppointmentAccess } from '../services/authorizationService.js';

export const requireAdminHospitalAccess = (param = 'hospitalId') => (request, _response, next) => {
  try {
    if (request.auth?.role !== 'ADMIN') throw new AppError('Administrator access required', 403);
    requireMatchingHospital(request.auth, request.params[param] || request.body.hospitalId);
    next();
  } catch (error) { next(error); }
};

export const requireAdminHospitalFromBody = (request, _response, next) => {
  try {
    if (request.auth?.role !== 'ADMIN') throw new AppError('Administrator access required', 403);
    requireMatchingHospital(request.auth, request.body.hospitalId);
    next();
  } catch (error) { next(error); }
};

export const requireNurseHospitalAccess = (param = 'hospitalId') => (request, _response, next) => {
  try {
    if (request.auth?.role !== 'NURSE') throw new AppError('Nurse access required', 403);
    requireMatchingHospital(request.auth, request.params[param] || request.body.hospitalId);
    next();
  } catch (error) { next(error); }
};

export const requireDoctorHospitalAccess = (param = 'hospitalId') => (request, _response, next) => {
  try {
    if (request.auth?.role !== 'DOCTOR') throw new AppError('Doctor access required', 403);
    requireMatchingHospital(request.auth, request.params[param] || request.body.hospitalId);
    next();
  } catch (error) { next(error); }
};

export const requireAdminDepartmentAccess = async (request, _response, next) => {
  try {
    if (request.auth?.role !== 'ADMIN') throw new AppError('Administrator access required', 403);
    await requireDepartmentHospital(request.auth, request.params.id || request.params.departmentId);
    next();
  } catch (error) { next(error); }
};

export const requirePatientOwnership = (param = 'patientId') => (request, _response, next) => {
  try {
    if (request.auth?.role !== 'PATIENT' || getPatientProfileId(request.auth) !== request.params[param]) throw new AppError('Not authorized', 403);
    next();
  } catch (error) { next(error); }
};

export const requirePatientRecordAccess = async (request, _response, next) => {
  try { await requirePatientAccess(request.auth, request.params.id || request.params.patientId); next(); } catch (error) { next(error); }
};

export const requireAppointmentRecordAccess = async (request, _response, next) => {
  try { await requireAppointmentAccess(request.auth, request.params.id); next(); } catch (error) { next(error); }
};

export const requireDoctorAppointmentAccess = async (request, _response, next) => {
  try {
    if (request.auth?.role !== 'DOCTOR') throw new AppError('Doctor access required', 403);
    await requireAppointmentAccess(request.auth, request.params.id);
    next();
  } catch (error) { next(error); }
};
