import { reviewCorrectionService } from '../services/reviewCorrectionService.js';
export const reviewCorrectionController={
 patients:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.patients(req.auth)}),
 nurses:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.nurses(req.auth)}),
 assignDepartment:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.assignNurseDepartment(req.auth,req.params.nurseId,req.body,req)}),
 assignAppointment:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.assignNurseAppointment(req.auth,req.params.appointmentId,req.body,req)}),
 appointments:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.appointments(req.auth,req.validatedQuery)}),
 analytics:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.analytics(req.auth)}),
 report:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.appointments(req.auth,req.validatedQuery)}),
 bulk:async(req,res)=>res.json({success:true,data:await reviewCorrectionService.bulkImport(req.auth,req.body.rows,req)}),
};
