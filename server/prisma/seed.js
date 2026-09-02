import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

if (process.env.NODE_ENV === 'production') throw new Error('Development seed data must not be loaded in production.');

const DEMO_PASSWORD = 'DemoOnly!ChangeMe2026';
const atTime = (hours, minutes = 0) => new Date(Date.UTC(1970, 0, 1, hours, minutes));
const onDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`);

async function upsertUser(email, role, passwordHash) {
  return prisma.user.upsert({
    where: { email },
    update: { role, passwordHash, active: true, emailVerified: true },
    create: { email, role, passwordHash, active: true, emailVerified: true },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const hospital = await prisma.hospital.upsert({
    where: { hospitalCode: 'VCTH-DEMO' },
    update: { active: true, name: 'CareSync Hospital' },
    create: { name: 'CareSync Hospital', hospitalCode: 'VCTH-DEMO', address: '1 Learning Avenue', city: 'Ho', region: 'Volta Region', country: 'Ghana', phone: '+233 30 000 0000', email: 'contact@voltacare-demo.invalid' },
  });

  const definitions = [
    ['General OPD', 'OPD', 'General outpatient services'], ['ENT', 'ENT', 'Ear, nose and throat clinic'],
    ['Maternity', 'MAT', 'Fictional development maternity clinic'], ['Pediatrics', 'PED', 'Child health clinic'],
    ['Cardiology', 'CARD', 'Heart and cardiovascular clinic'], ['Dental', 'DENT', 'Dental clinic'],
    ['Ophthalmology', 'EYE', 'Eye clinic'], ['Fertility Clinic', 'FERT', 'Fertility care clinic'],
    ['Orthopedics', 'ORTH', 'Musculoskeletal clinic'], ['Physiotherapy', 'PHYSIO', 'Rehabilitation services'], ['Laboratory', 'LAB', 'Diagnostic laboratory services'],
  ];
  const departments = {};
  for (const [name, code, description] of definitions) {
    departments[code] = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code } },
      update: { name, description, active: true },
      create: { hospitalId: hospital.id, name, code, description },
    });
  }

  const clinicDays = {
    OPD: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], ENT: ['TUESDAY', 'THURSDAY'],
    MAT: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], PED: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    CARD: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], DENT: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'], EYE: ['TUESDAY', 'FRIDAY'],
  };
  await prisma.departmentSchedule.createMany({
    data: Object.entries(clinicDays).flatMap(([code, days]) => days.map((dayOfWeek) => ({ hospitalId: hospital.id, departmentId: departments[code].id, dayOfWeek, startTime: atTime(8), endTime: atTime(16), dailyCapacity: code === 'OPD' ? 120 : 40 }))),
    skipDuplicates: true,
  });

  const adminUser = await upsertUser('admin@voltacare-demo.invalid', 'ADMIN', passwordHash);
  const nurseUser = await upsertUser('nurse.ama@voltacare-demo.invalid', 'NURSE', passwordHash);
  const patientUserOne = await upsertUser('patient.kofi@voltacare-demo.invalid', 'PATIENT', passwordHash);
  const patientUserTwo = await upsertUser('patient.esi@voltacare-demo.invalid', 'PATIENT', passwordHash);
  const admin = await prisma.adminProfile.upsert({ where: { userId: adminUser.id }, update: { active: true }, create: { userId: adminUser.id, hospitalId: hospital.id, employeeNumber: 'ADM-DEMO-001', firstName: 'Akosua', lastName: 'Mensah', phone: '+233 20 000 0001' } });
  const nurse = await prisma.nurseProfile.upsert({ where: { userId: nurseUser.id }, update: { active: true }, create: { userId: nurseUser.id, hospitalId: hospital.id, employeeNumber: 'NUR-DEMO-001', firstName: 'Ama', lastName: 'Dartey', phone: '+233 20 000 0002', licenseNumber: 'DEMO-NURSE-LIC-001' } });
  await prisma.nurseDepartment.upsert({ where: { nurseId_departmentId: { nurseId: nurse.id, departmentId: departments.OPD.id } }, update: { active: true }, create: { nurseId: nurse.id, departmentId: departments.OPD.id } });

  const patientOne = await prisma.patientProfile.upsert({ where: { userId: patientUserOne.id }, update: { active: true }, create: { userId: patientUserOne.id, firstName: 'Kofi', lastName: 'Adjei', dateOfBirth: onDate('1994-06-15'), gender: 'MALE', phone: '+233 20 000 0101', address: '10 Fictional Street', city: 'Ho', region: 'Volta Region', emergencyContactName: 'Demo Contact One', emergencyContactPhone: '+233 20 000 0191' } });
  const patientTwo = await prisma.patientProfile.upsert({ where: { userId: patientUserTwo.id }, update: { active: true }, create: { userId: patientUserTwo.id, firstName: 'Esi', lastName: 'Aidoo', otherNames: 'Fictional', dateOfBirth: onDate('1988-11-03'), gender: 'FEMALE', phone: '+233 20 000 0102', address: '20 Sample Road', city: 'Ho', region: 'Volta Region', emergencyContactName: 'Demo Contact Two', emergencyContactPhone: '+233 20 000 0192' } });
  for (const [patient, number] of [[patientOne, 'VCTH-P-DEMO-001'], [patientTwo, 'VCTH-P-DEMO-002']]) {
    await prisma.patientHospitalRecord.upsert({ where: { patientId_hospitalId: { patientId: patient.id, hospitalId: hospital.id } }, update: { status: 'ACTIVE' }, create: { patientId: patient.id, hospitalId: hospital.id, hospitalPatientNumber: number, status: 'ACTIVE' } });
  }

  const cards = [[patientOne.id, 'HOSPITAL_CARD', 'VCTH-CARD-DEMO-001', 'VERIFIED'], [patientOne.id, 'NHIS_CARD', 'NHIS-DEMO-0001', 'PENDING'], [patientTwo.id, 'HOSPITAL_CARD', 'VCTH-CARD-DEMO-002', 'VERIFIED']];
  for (const [patientId, cardType, cardNumber, verificationStatus] of cards) {
    await prisma.patientCard.upsert({
      where: { hospitalId_cardType_cardNumber: { hospitalId: hospital.id, cardType, cardNumber } }, update: { active: true, verificationStatus },
      create: { patientId, hospitalId: hospital.id, cardType, cardNumber, verificationStatus, ...(verificationStatus === 'VERIFIED' ? { verifiedByAdminId: admin.id, verifiedAt: new Date() } : {}) },
    });
  }

  const doctorDefinitions = [
    { email: 'doctor.yaw@voltacare-demo.invalid', firstName: 'Yaw', lastName: 'Boateng', code: 'OPD', specialization: 'General Practice', license: 'DEMO-MD-001', employee: 'DOC-DEMO-001', days: clinicDays.OPD },
    { email: 'doctor.afia@voltacare-demo.invalid', firstName: 'Afia', lastName: 'Owusu', code: 'ENT', specialization: 'Otolaryngology', license: 'DEMO-MD-002', employee: 'DOC-DEMO-002', days: clinicDays.ENT },
    { email: 'doctor.kojo@voltacare-demo.invalid', firstName: 'Kojo', lastName: 'Asare', code: 'CARD', specialization: 'Cardiology', license: 'DEMO-MD-003', employee: 'DOC-DEMO-003', days: clinicDays.CARD },
    { email: 'doctor.ena@voltacare-demo.invalid', firstName: 'Ena', lastName: 'Agbemava', code: 'PED', specialization: 'Pediatrics', license: 'DEMO-MD-004', employee: 'DOC-DEMO-004', days: clinicDays.PED },
  ];
  const doctors = [];
  for (const item of doctorDefinitions) {
    const user = await upsertUser(item.email, 'DOCTOR', passwordHash);
    const doctor = await prisma.doctorProfile.upsert({ where: { userId: user.id }, update: { active: true, specialization: item.specialization }, create: { userId: user.id, firstName: item.firstName, lastName: item.lastName, phone: '+233 20 000 0200', employeeNumber: item.employee, licenseNumber: item.license, specialization: item.specialization, qualification: 'Fictional development qualification' } });
    await prisma.doctorHospital.upsert({ where: { doctorId_hospitalId: { doctorId: doctor.id, hospitalId: hospital.id } }, update: { active: true }, create: { doctorId: doctor.id, hospitalId: hospital.id, employeeNumber: item.employee, startedAt: onDate('2025-01-01') } });
    await prisma.doctorDepartment.upsert({ where: { doctorId_departmentId_hospitalId: { doctorId: doctor.id, departmentId: departments[item.code].id, hospitalId: hospital.id } }, update: { active: true, primaryDepartment: true }, create: { doctorId: doctor.id, departmentId: departments[item.code].id, hospitalId: hospital.id, primaryDepartment: true } });
    await prisma.doctorSchedule.createMany({ data: item.days.map((dayOfWeek) => ({ doctorId: doctor.id, departmentId: departments[item.code].id, hospitalId: hospital.id, dayOfWeek, startTime: atTime(8), endTime: atTime(16), consultationDurationMinutes: 20, maximumPatients: 24 })), skipDuplicates: true });
    doctors.push({ ...item, doctor });
  }

  const slotDate = onDate('2026-09-07');
  for (const entry of doctors.slice(0, 3)) {
    for (const hour of [9, 10, 11]) {
      await prisma.appointmentSlot.upsert({ where: { doctorId_date_startTime_endTime: { doctorId: entry.doctor.id, date: slotDate, startTime: atTime(hour), endTime: atTime(hour, 20) } }, update: { capacity: 1, status: 'AVAILABLE' }, create: { hospitalId: hospital.id, departmentId: departments[entry.code].id, doctorId: entry.doctor.id, date: slotDate, startTime: atTime(hour), endTime: atTime(hour, 20), capacity: 1 } });
    }
  }

  console.log('Development seed completed with fictional CareSync Hospital data.');
  console.log('The development-only password is documented in docs/DATABASE_SETUP.md.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
