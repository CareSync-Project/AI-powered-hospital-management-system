import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { assessSymptomsHybrid } from '../ai/hybridAssessmentService.js';
import { auditService } from './auditService.js';

function serialize(record, clinical = false) {
  const json = record.possibleConditions || {};
  return { id: record.id, assessmentId: record.id, title: 'AI-Assisted Preliminary Symptom Assessment', ...(clinical ? { symptomsText: record.symptomsText, duration: record.duration, severity: record.severity } : {}), structuredSymptoms: json.structuredSymptoms || [], possibleConditions: json.results || [], recommendedDepartment: record.recommendedDepartment || null, recommendedDepartmentCategory: json.recommendedDepartmentCategory, urgency: record.urgencyLevel, recommendedAction: record.recommendedAction, explanation: record.explanation, redFlagDetected: record.redFlagDetected, redFlags: json.redFlags || [], assessmentMethod: json.assessmentMethod || 'RULE_BASED', assessmentVersion: record.assessmentVersion, disclaimer: json.disclaimer, appointmentId: record.appointmentId, createdAt: record.createdAt };
}
const include = { recommendedDepartment: { select: { id: true, hospitalId: true, name: true, code: true } } };

export const symptomAssessmentService = {
  async create(patient, userId, input, request, dependencies = {}) {
    const hospital = await prisma.hospital.findFirst({ where: { id: input.hospitalId, active: true } });
    if (!hospital) throw new AppError('Hospital not found or inactive', 404);
    const result = await assessSymptomsHybrid(input, dependencies);
    const record = await prisma.symptomAssessment.create({ data: { patientId: patient.id, hospitalId: input.hospitalId, symptomsText: input.symptomsText, duration: input.duration || null, severity: input.severity, possibleConditions: { structuredSymptoms: result.normalizedSymptoms, results: result.possibleConditions, redFlags: result.redFlags, recommendedDepartmentCategory: result.recommendedDepartmentCategory, assessmentMethod: result.assessmentMethod, disclaimer: result.disclaimer, pregnancyStatus: input.pregnancyStatus, temperature: input.temperature ?? null, heartRate: input.heartRate ?? null, oxygenSaturation: input.oxygenSaturation ?? null, additionalNotes: input.additionalNotes || null }, recommendedDepartmentId: result.recommendedDepartment?.id || null, urgencyLevel: result.urgency, recommendedAction: result.recommendedAction, explanation: result.explanation, redFlagDetected: result.redFlags.length > 0, assessmentVersion: result.modelVersion }, include });
    await auditService.record({ userId, hospitalId: input.hospitalId, action: 'SYMPTOM_ASSESSMENT_CREATED', resourceType: 'SymptomAssessment', resourceId: record.id, metadata: { patientId: patient.id, recommendedDepartmentId: record.recommendedDepartmentId, urgency: record.urgencyLevel, redFlagDetected: record.redFlagDetected, assessmentVersion: record.assessmentVersion, assessmentMethod: result.assessmentMethod }, request });
    return serialize(record);
  },
  async list(patientId) { return (await prisma.symptomAssessment.findMany({ where: { patientId }, include, orderBy: { createdAt: 'desc' } })).map(item => serialize(item)); },
  async get(id, patientId) { const item = await prisma.symptomAssessment.findUnique({ where: { id }, include }); if (!item) throw new AppError('Symptom assessment not found', 404); if (item.patientId !== patientId) throw new AppError('Not authorized', 403); return serialize(item); },
  async clinicalForAppointment(appointmentId, auth) { const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } }); if (!appointment) throw new AppError('Appointment not found', 404); const allowed = (auth.role === 'DOCTOR' && auth.user.doctorProfile?.id === appointment.doctorId) || (auth.role === 'NURSE' && auth.user.nurseProfile?.hospitalId === appointment.hospitalId); if (!allowed) throw new AppError('Not authorized', 403); const item = await prisma.symptomAssessment.findFirst({ where: { appointmentId }, include }); return item ? serialize(item, true) : null; },
};
