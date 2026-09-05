import prisma from '../config/prisma.js';
const PRIORITY = { EMERGENCY: 0, HIGH: 1, MODERATE: 2, LOW: 3, ROUTINE: 4 };
export function orderQueue(items) { return [...items].sort((a,b) => (PRIORITY[a.triageRecords[0]?.urgencyLevel || 'ROUTINE'] - PRIORITY[b.triageRecords[0]?.urgencyLevel || 'ROUTINE']) || new Date(a.triagedAt || a.checkedInAt || a.startTime) - new Date(b.triagedAt || b.checkedInAt || b.startTime)); }
const include = {
  patient: { select: {
    id:true, firstName:true, lastName:true, otherNames:true, dateOfBirth:true, gender:true,
    phone:true, address:true, city:true, region:true, emergencyContactName:true,
    emergencyContactPhone:true, user:{select:{email:true}},
    hospitalRecords:{select:{hospitalId:true,hospitalPatientNumber:true,status:true}},
  } },
  department: { select:{id:true,name:true} },
  doctor:{select:{id:true,firstName:true,lastName:true}},
  nurseAssignments:{where:{active:true},select:{nurseId:true,assignedAt:true}},
  triageRecords:{take:1,orderBy:{createdAt:'desc'}},
  vitalRecords:{where:{verificationStatus:'VERIFIED'},take:5,orderBy:{recordedAt:'desc'}},
  symptomAssessments:{where:{appointmentId:{not:null}},take:1,orderBy:{createdAt:'desc'},select:{id:true,symptomsText:true,severity:true,urgencyLevel:true,redFlagDetected:true,possibleConditions:true,assessmentVersion:true}},
};
export const queueService = {
  async nurse(nurseId, date = new Date()) { const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);const rows=await prisma.appointment.findMany({where:{appointmentDate:{gte:start,lt:end},status:{in:['CONFIRMED','CHECKED_IN','TRIAGED','WAITING','IN_CONSULTATION']},nurseAssignments:{some:{nurseId,active:true}}},include});return orderQueue(rows); },
  async nurseAssigned(nurseId) { return prisma.appointment.findMany({where:{status:{notIn:['CANCELLED','MISSED']},nurseAssignments:{some:{nurseId,active:true}}},include,orderBy:[{appointmentDate:'desc'},{startTime:'asc'}]}); },
  async doctor(doctorId, date = new Date()) { const start=new Date(date);start.setUTCHours(0,0,0,0);const end=new Date(start);end.setUTCDate(end.getUTCDate()+1);const rows=await prisma.appointment.findMany({where:{doctorId,appointmentDate:{gte:start,lt:end},status:{in:['PENDING','CONFIRMED','CHECKED_IN','TRIAGED','WAITING','IN_CONSULTATION']}},include});return orderQueue(rows); },
};
