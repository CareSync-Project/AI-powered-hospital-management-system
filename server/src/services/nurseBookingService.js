import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { appointmentService } from './appointmentService.js';
import { patientDiscoveryService } from './patientDiscoveryService.js';
import { notificationService } from './notificationService.js';
import { auditService } from './auditService.js';

const dateOnly = value => value.toISOString().slice(0, 10);
const timeOnly = value => value.toISOString().slice(11, 16);

async function requireAssignedPatient(nurseId, patientId) {
  const assignment = await prisma.nurseAppointmentAssignment.findFirst({ where: { nurseId, active:true, appointment:{patientId} }, select:{id:true} });
  if (!assignment) throw new AppError('You can only book for a patient currently assigned to you', 403);
}

export const nurseBookingService = {
  async context(nurse) {
    const assignments = await prisma.nurseAppointmentAssignment.findMany({
      where:{nurseId:nurse.id,active:true},
      select:{appointment:{select:{patient:{select:{id:true,firstName:true,lastName:true,dateOfBirth:true,phone:true}}}}},
    });
    const patients = [...new Map(assignments.map(x => [x.appointment.patient.id, x.appointment.patient])).values()];
    return { patients, departments:await patientDiscoveryService.departments(nurse.hospitalId) };
  },
  async doctors(nurse, patientId, departmentId, date) {
    await requireAssignedPatient(nurse.id, patientId);
    const department = await prisma.department.findFirst({where:{id:departmentId,hospitalId:nurse.hospitalId,active:true}});
    if (!department) throw new AppError('Department not found',404);
    return patientDiscoveryService.doctors(departmentId,date);
  },
  async book(nurse, userId, data, request) {
    await requireAssignedPatient(nurse.id, data.patientId);
    const slot = await prisma.appointmentSlot.findUnique({where:{id:data.slotId}});
    if (!slot || slot.hospitalId !== nurse.hospitalId) throw new AppError('Appointment slot not found',404);
    const appointment = await appointmentService.create({
      patientId:data.patientId,hospitalId:slot.hospitalId,departmentId:slot.departmentId,doctorId:slot.doctorId,
      appointmentSlotId:slot.id,patientCardId:null,appointmentDate:dateOnly(slot.date),startTime:timeOnly(slot.startTime),endTime:timeOnly(slot.endTime),
      reasonForVisit:data.reasonForVisit,symptomsSummary:data.symptomsSummary||null,urgency:'ROUTINE',bookingMethod:'STAFF',
    });
    await prisma.nurseAppointmentAssignment.create({data:{nurseId:nurse.id,appointmentId:appointment.id,assignedByUserId:userId}});
    const patient = await prisma.patientProfile.findUnique({where:{id:data.patientId},select:{userId:true}});
    await notificationService.create({userId:patient.userId,hospitalId:nurse.hospitalId,title:'Appointment booked by your nurse',message:`Appointment ${appointment.appointmentNumber} was booked for you.`,type:'APPOINTMENT'});
    await auditService.record({userId,hospitalId:nurse.hospitalId,action:'NURSE_ASSISTED_APPOINTMENT_CREATED',resourceType:'Appointment',resourceId:appointment.id,metadata:{patientId:data.patientId},request});
    return appointment;
  },
};
