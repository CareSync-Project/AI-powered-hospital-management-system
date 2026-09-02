import { doctorRepository } from '../repositories/doctorRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/prisma.js';

export async function validateDoctorDepartmentContext(doctorId, departmentId, hospitalId, repositories = { doctorRepository, departmentRepository }, client) {
  const [affiliation, assignment, department] = await Promise.all([
    repositories.doctorRepository.findAffiliation(doctorId, hospitalId, client),
    repositories.doctorRepository.findDepartmentAssignment(doctorId, departmentId, hospitalId, client),
    repositories.departmentRepository.findById(departmentId, client),
  ]);

  if (!department || department.hospitalId !== hospitalId) throw new AppError('Department does not belong to the hospital', 400);
  if (!affiliation?.active) throw new AppError('Doctor is not actively affiliated with the hospital', 400);
  if (!assignment?.active) throw new AppError('Doctor is not actively assigned to the department', 400);
  return { affiliation, assignment, department };
}

export const doctorService = {
  async dailyAppointments(doctorId, date = new Date()) { const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);const items=await prisma.appointment.findMany({where:{doctorId,appointmentDate:{gte:start,lt:end}},include:{patient:{select:{firstName:true,lastName:true}},department:{select:{id:true,name:true}}},orderBy:{startTime:'asc'}});return{items,counts:{total:items.length,confirmed:items.filter(x=>x.status==='CONFIRMED').length,waiting:items.filter(x=>x.status==='WAITING').length,inConsultation:items.filter(x=>x.status==='IN_CONSULTATION').length,completed:items.filter(x=>x.status==='COMPLETED').length}};},
  async reports(doctorId){const now=new Date(),today=new Date(now);today.setHours(0,0,0,0);const week=new Date(today);week.setDate(week.getDate()-6);const month=new Date(today.getFullYear(),today.getMonth(),1);const items=await prisma.appointment.findMany({where:{doctorId},include:{department:{select:{id:true,name:true}},consultation:{select:{followUpRequired:true}}}});const completedSince=date=>items.filter(x=>x.status==='COMPLETED'&&x.appointmentDate>=date).length;const statuses=Object.entries(items.reduce((m,x)=>{m[x.status]=(m[x.status]||0)+1;return m},{})).map(([status,count])=>({status,count}));const departments=Object.values(items.reduce((m,x)=>{m[x.departmentId]??={department:x.department.name,count:0};m[x.departmentId].count++;return m},{}));return{completedToday:completedSince(today),completedWeek:completedSince(week),completedMonth:completedSince(month),followUpCount:items.filter(x=>x.consultation?.followUpRequired).length,statuses,departments};},
  listByHospital: (hospitalId) => doctorRepository.findPublicByHospital(hospitalId),
  async get(id) {
    const doctor = await doctorRepository.findPublicById(id);
    if (!doctor) throw new AppError('Doctor not found', 404);
    return doctor;
  },
  createAffiliation: (data) => doctorRepository.createAffiliation(data),
  async assignDepartment(data) {
    const department = await departmentRepository.findById(data.departmentId);
    const affiliation = await doctorRepository.findAffiliation(data.doctorId, data.hospitalId);
    if (!department || department.hospitalId !== data.hospitalId) throw new AppError('Department does not belong to the hospital', 400);
    if (!affiliation?.active) throw new AppError('Doctor must have an active hospital affiliation', 400);
    const existing = await doctorRepository.findDepartmentAssignment(data.doctorId, data.departmentId, data.hospitalId);
    if (existing?.active) throw new AppError('Doctor is already assigned to this department', 409);
    return prisma.$transaction(async (tx) => {
      if (data.primaryDepartment) await tx.doctorDepartment.updateMany({ where: { doctorId: data.doctorId, hospitalId: data.hospitalId, primaryDepartment: true, active: true }, data: { primaryDepartment: false } });
      return tx.doctorDepartment.upsert({ where: { doctorId_departmentId_hospitalId: { doctorId: data.doctorId, departmentId: data.departmentId, hospitalId: data.hospitalId } }, update: { active: true, primaryDepartment: data.primaryDepartment }, create: data, include: { department: true } });
    });
  },
  async listForAdmin(hospitalId) { return doctorRepository.findByHospital(hospitalId); },
  async updateForHospital(doctorId, hospitalId, data) {
    const affiliation = await doctorRepository.findAffiliation(doctorId, hospitalId);
    if (!affiliation) throw new AppError('Doctor does not belong to this hospital', 403);
    return prisma.$transaction(async (tx) => {
      const profile = await tx.doctorProfile.update({ where: { id: doctorId }, data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, specialization: data.specialization, qualification: data.qualification, active: data.active } });
      if (data.active !== undefined) await tx.doctorHospital.update({ where: { doctorId_hospitalId: { doctorId, hospitalId } }, data: { active: data.active, ...(data.active ? { endedAt: null } : { endedAt: new Date() }) } });
      return profile;
    });
  },
  async deactivateAssignment(doctorId, departmentId, hospitalId) {
    const assignment = await doctorRepository.findDepartmentAssignment(doctorId, departmentId, hospitalId);
    if (!assignment) throw new AppError('Doctor department assignment not found', 404);
    return prisma.doctorDepartment.update({ where: { doctorId_departmentId_hospitalId: { doctorId, departmentId, hospitalId } }, data: { active: false, primaryDepartment: false } });
  },
};
