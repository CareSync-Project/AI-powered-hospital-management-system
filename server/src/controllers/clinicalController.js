import { appointmentWorkflowService } from '../services/appointmentWorkflowService.js'; import { queueService } from '../services/queueService.js'; import { vitalService } from '../services/vitalService.js'; import { triageService } from '../services/triageService.js'; import { consultationService } from '../services/consultationService.js'; import { getPatientProfileId } from '../services/authorizationService.js'; import { AppError } from '../middleware/errorHandler.js';
import { careSyncHospitalService } from '../services/careSyncHospitalService.js';
export const clinicalController={
 async nurseWorklist(req,res){res.json({success:true,data:await queueService.nurse(req.auth.user.nurseProfile.hospitalId)})},
 async nurseAssigned(req,res){const data=await import('../config/prisma.js').then(({default:prisma})=>prisma.appointment.findMany({where:{nurseAssignments:{some:{nurseId:req.auth.user.nurseProfile.id,active:true}}},include:{patient:{select:{id:true,firstName:true,lastName:true}},department:{select:{id:true,name:true}},doctor:{select:{id:true,firstName:true,lastName:true}},triageRecords:{take:1,orderBy:{createdAt:'desc'}},vitalRecords:{where:{verificationStatus:'VERIFIED'},take:1,orderBy:{recordedAt:'desc'}}},orderBy:[{appointmentDate:'asc'},{startTime:'asc'}]}));res.json({success:true,data})},
 async doctorQueue(req,res){res.json({success:true,data:await queueService.doctor(req.auth.user.doctorProfile.id)})},
 async checkIn(req,res){res.json({success:true,data:await appointmentWorkflowService.transition({appointmentId:req.params.id,actor:req.auth,toStatus:'CHECKED_IN',action:'APPOINTMENT_CHECKED_IN',request:req,notify:true})})},
 async vitals(req,res){res.json({success:true,data:await vitalService.listForAppointment(req.params.id,req.auth)})},
 async recordVitals(req,res){res.status(201).json({success:true,data:await vitalService.createClinical(req.params.id,req.auth,req.body,req)})},
 async verifyVital(req,res){res.json({success:true,data:await vitalService.verify(req.params.id,req.auth,req)})},
 async triage(req,res){res.status(201).json({success:true,data:await triageService.save(req.params.id,req.auth.user.nurseProfile,req.body,req)})},
 async waiting(req,res){res.json({success:true,data:await appointmentWorkflowService.transition({appointmentId:req.params.id,actor:req.auth,toStatus:'WAITING',action:'APPOINTMENT_MOVED_TO_WAITING',request:req})})},
 async context(req,res){res.json({success:true,data:await consultationService.getContext(req.params.id,req.auth.user.doctorProfile.id)})},
 async start(req,res){res.json({success:true,data:await consultationService.start(req.params.id,req.auth.user.doctorProfile,req)})},
 async save(req,res){res.json({success:true,data:await consultationService.save(req.params.id,req.auth.user.doctorProfile,req.body,req)})},
 async complete(req,res){res.json({success:true,data:await consultationService.complete(req.params.id,req.auth.user.doctorProfile,req.body,req)})},
 async patientVitals(req,res){res.json({success:true,data:await vitalService.list(getPatientProfileId(req.auth))})},
 async patientVitalCreate(req,res){const hospital=await careSyncHospitalService.get();res.status(201).json({success:true,data:await vitalService.create(getPatientProfileId(req.auth),{...req.body,hospitalId:hospital.id,source:'PATIENT',verificationStatus:'UNVERIFIED',recordedByUserId:req.auth.userId})})},
 async progress(req,res){const item=await import('../config/prisma.js').then(m=>m.default.appointment.findFirst({where:{id:req.params.id,patientId:getPatientProfileId(req.auth)},select:{id:true,status:true,checkedInAt:true,triagedAt:true,consultationStartedAt:true,completedAt:true}}));if(!item)throw new AppError('Appointment not found',404);res.json({success:true,data:item})},
 async patientConsultation(req,res){res.json({success:true,data:await consultationService.patientSummary(req.params.id,getPatientProfileId(req.auth))})},
};
