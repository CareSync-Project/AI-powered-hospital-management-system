import { describe, expect, test, afterAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import prisma from '../src/config/prisma.js';
import { careSyncHospitalService } from '../src/services/careSyncHospitalService.js';
import { reviewCorrectionService } from '../src/services/reviewCorrectionService.js';
import { bulkStaffSchema } from '../src/validators/reviewCorrectionValidators.js';
import { createPatientCardSchema } from '../src/validators/patientCardValidators.js';
import { recommendationSchema } from '../src/validators/patientSelfServiceValidators.js';

describe.sequential('Phase 8.1 single-hospital review corrections',()=>{
 afterAll(()=>prisma.$disconnect());
 test('final Prisma roles exclude SUPER_ADMIN',async()=>{const schema=await readFile(new URL('../prisma/schema.prisma',import.meta.url),'utf8');const block=schema.match(/enum UserRole \{([\s\S]*?)\}/)[1];expect(block).not.toContain('SUPER_ADMIN');for(const role of ['ADMIN','DOCTOR','NURSE','PATIENT'])expect(block).toContain(role)});
 test('super-admin API is not exposed',async()=>{const routes=await readFile(new URL('../src/routes/index.js',import.meta.url),'utf8');expect(routes).not.toContain('super-admin');expect(routes).not.toContain('superAdmin')});
 test('no active SUPER_ADMIN database account remains',async()=>{const rows=await prisma.$queryRawUnsafe(`SELECT count(*)::int AS count FROM "User" WHERE "role"::text = 'SUPER_ADMIN'`);expect(rows[0].count).toBe(0)});
 test('CareSync Hospital resolves automatically',async()=>{const hospital=await careSyncHospitalService.get();expect(hospital.name).toBe('CareSync Hospital');expect(hospital.active).not.toBe(false)});
 test('patient card input no longer requires hospitalId',()=>{expect(createPatientCardSchema.safeParse({cardType:'NHIS_CARD',cardNumber:'TEST-1234'}).success).toBe(true)});
 test('patient announcements do not require a hospital record',async()=>{const source=await readFile(new URL('../src/controllers/announcementController.js',import.meta.url),'utf8');expect(source).toContain("hospitalConditions.push({ role: 'PATIENT' })");expect(source).not.toContain("patientProfile: { hospitalRecords: { some: { hospitalId, status: 'ACTIVE' }")});
 test('appointment recommendation no longer requires hospitalId',()=>{expect(recommendationSchema.safeParse({departmentId:'11111111-1111-4111-8111-111111111111',date:new Date(Date.now()+86400000).toISOString().slice(0,10)}).success).toBe(true)});
 test('bulk import rejects ADMIN and SUPER_ADMIN roles',()=>{const base={firstName:'Test',lastName:'User',email:'test@example.invalid',phone:'+233200000000',employeeNumber:'EMP-1',department:'General OPD',specialization:'General',qualification:'Test',licenseNumber:'LIC-1',initialPassword:'StrongPass123'};expect(bulkStaffSchema.safeParse({rows:[{...base,role:'ADMIN'}]}).success).toBe(false);expect(bulkStaffSchema.safeParse({rows:[{...base,role:'SUPER_ADMIN'}]}).success).toBe(false)});
 test('seeded nurse has normalized department assignment',async()=>{const nurse=await prisma.nurseProfile.findFirst({where:{user:{email:'nurse.ama@voltacare-demo.invalid'}},include:{departments:true}});expect(nurse.departments.some(item=>item.active)).toBe(true)});
 test('admin analytics are PostgreSQL-backed and separate patients from appointments',async()=>{const admin=await prisma.user.findUnique({where:{email:'admin@voltacare-demo.invalid'},include:{adminProfile:true}});const data=await reviewCorrectionService.analytics({userId:admin.id,user:admin,role:'ADMIN'});expect(data).toHaveProperty('totalPatients');expect(data).toHaveProperty('appointmentsMonth');expect(data).toHaveProperty('appointmentsByDepartment')});
 test('CareSync migration models prevent duplicate nurse assignments',async()=>{const indexes=await prisma.$queryRawUnsafe(`SELECT indexname FROM pg_indexes WHERE tablename IN ('NurseDepartment','NurseAppointmentAssignment')`);expect(indexes.some(x=>x.indexname.includes('nurseId_departmentId_key'))).toBe(true);expect(indexes.some(x=>x.indexname.includes('nurseId_appointmentId_key'))).toBe(true)});
});
