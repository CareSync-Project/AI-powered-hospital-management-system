import prisma from '../config/prisma.js';
import { careSyncHospitalService } from './careSyncHospitalService.js';
const dateAt=value=>new Date(`${value}T00:00:00.000Z`);
export const patientDiscoveryService={
  hospitals:async()=>[await careSyncHospitalService.get()],
  departments:hospitalId=>prisma.department.findMany({where:{hospitalId,active:true},select:{id:true,hospitalId:true,name:true,description:true,schedules:{where:{active:true},select:{dayOfWeek:true,startTime:true,endTime:true},orderBy:{dayOfWeek:'asc'}}},orderBy:{name:'asc'}}),
  async departmentByName(hospitalId,name){return prisma.department.findFirst({where:{hospitalId,active:true,name:{contains:name,mode:'insensitive'}},select:{id:true,hospitalId:true,name:true,description:true,schedules:{where:{active:true},select:{dayOfWeek:true,startTime:true,endTime:true},orderBy:{dayOfWeek:'asc'}}}});},
  async doctors(departmentId,date){const doctors=await prisma.doctorProfile.findMany({where:{active:true,departments:{some:{departmentId,active:true}},appointmentSlots:{some:{departmentId,date:dateAt(date),status:'AVAILABLE'}}},select:{id:true,firstName:true,lastName:true,specialization:true,appointmentSlots:{where:{departmentId,date:dateAt(date),status:'AVAILABLE'},select:{id:true,date:true,startTime:true,endTime:true,capacity:true,bookedCount:true},orderBy:{startTime:'asc'}}},orderBy:{lastName:'asc'}});return doctors.map(doctor=>({...doctor,appointmentSlots:doctor.appointmentSlots.filter(slot=>slot.bookedCount<slot.capacity)})).filter(doctor=>doctor.appointmentSlots.length);},
};
