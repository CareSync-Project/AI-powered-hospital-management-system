-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "PatientHospitalStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('HOSPITAL_CARD', 'NHIS_CARD');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ScheduleExceptionType" AS ENUM ('UNAVAILABLE', 'LEAVE', 'CUSTOM_HOURS', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "AppointmentSlotStatus" AS ENUM ('AVAILABLE', 'FULL', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AppointmentUrgency" AS ENUM ('ROUTINE', 'LOW', 'MODERATE', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BookingMethod" AS ENUM ('PATIENT_PWA', 'STAFF', 'WALK_IN', 'AI_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'TRIAGED', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "VitalSource" AS ENUM ('PATIENT', 'NURSE', 'DOCTOR', 'CONNECTED_DEVICE');

-- CreateEnum
CREATE TYPE "VitalVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT', 'CARD_VERIFICATION', 'SCHEDULE', 'SYSTEM', 'CONSULTATION', 'REMINDER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hospitalCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientHospitalRecord" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "hospitalPatientNumber" TEXT NOT NULL,
    "status" "PatientHospitalStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientHospitalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCard" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "cardType" "CardType" NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedByAdminId" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requiresAppointment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentSchedule" (
    "id" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "dailyCapacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorHospital" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" DATE NOT NULL,
    "endedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorHospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorDepartment" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "primaryDepartment" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "consultationDurationMinutes" INTEGER NOT NULL,
    "maximumPatients" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "exceptionType" "ScheduleExceptionType" NOT NULL,
    "reason" TEXT,
    "startTime" TIME(0),
    "endTime" TIME(0),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AppointmentSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientCardId" UUID,
    "appointmentSlotId" UUID,
    "appointmentDate" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "reasonForVisit" TEXT NOT NULL,
    "symptomsSummary" TEXT,
    "urgency" "AppointmentUrgency" NOT NULL DEFAULT 'ROUTINE',
    "bookingMethod" "BookingMethod" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "checkedInAt" TIMESTAMP(3),
    "triagedAt" TIMESTAMP(3),
    "consultationStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalRecord" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "hospitalId" UUID NOT NULL,
    "temperature" DECIMAL(4,1),
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "oxygenSaturation" DECIMAL(5,2),
    "respiratoryRate" INTEGER,
    "weight" DECIMAL(6,2),
    "height" DECIMAL(5,2),
    "bmi" DECIMAL(5,2),
    "bloodGlucose" DECIMAL(6,2),
    "source" "VitalSource" NOT NULL,
    "verificationStatus" "VitalVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "recordedByUserId" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageRecord" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "nurseId" UUID NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "triageNotes" TEXT,
    "urgencyLevel" "AppointmentUrgency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomAssessment" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "appointmentId" UUID,
    "symptomsText" TEXT NOT NULL,
    "duration" TEXT,
    "severity" TEXT,
    "possibleConditions" JSONB,
    "recommendedDepartmentId" UUID,
    "urgencyLevel" "AppointmentUrgency" NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "redFlagDetected" BOOLEAN NOT NULL DEFAULT false,
    "assessmentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SymptomAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "clinicalObservations" TEXT,
    "consultationNotes" TEXT,
    "diagnosis" TEXT,
    "treatmentPlan" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATE,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hospitalId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hospitalId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_hospitalCode_key" ON "Hospital"("hospitalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_email_key" ON "Hospital"("email");

-- CreateIndex
CREATE INDEX "Hospital_name_idx" ON "Hospital"("name");

-- CreateIndex
CREATE INDEX "Hospital_region_active_idx" ON "Hospital"("region", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE INDEX "AdminProfile_hospitalId_active_idx" ON "AdminProfile"("hospitalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_hospitalId_employeeNumber_key" ON "AdminProfile"("hospitalId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE INDEX "PatientProfile_lastName_firstName_idx" ON "PatientProfile"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "PatientProfile_active_idx" ON "PatientProfile"("active");

-- CreateIndex
CREATE INDEX "PatientHospitalRecord_hospitalId_status_idx" ON "PatientHospitalRecord"("hospitalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PatientHospitalRecord_hospitalId_hospitalPatientNumber_key" ON "PatientHospitalRecord"("hospitalId", "hospitalPatientNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatientHospitalRecord_patientId_hospitalId_key" ON "PatientHospitalRecord"("patientId", "hospitalId");

-- CreateIndex
CREATE INDEX "PatientCard_patientId_active_idx" ON "PatientCard"("patientId", "active");

-- CreateIndex
CREATE INDEX "PatientCard_hospitalId_verificationStatus_idx" ON "PatientCard"("hospitalId", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PatientCard_hospitalId_cardType_cardNumber_key" ON "PatientCard"("hospitalId", "cardType", "cardNumber");

-- CreateIndex
CREATE INDEX "Department_hospitalId_active_idx" ON "Department"("hospitalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_name_key" ON "Department"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_code_key" ON "Department"("hospitalId", "code");

-- CreateIndex
CREATE INDEX "DepartmentSchedule_hospitalId_dayOfWeek_idx" ON "DepartmentSchedule"("hospitalId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DepartmentSchedule_departmentId_active_idx" ON "DepartmentSchedule"("departmentId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentSchedule_departmentId_dayOfWeek_startTime_endTime_key" ON "DepartmentSchedule"("departmentId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_licenseNumber_key" ON "DoctorProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DoctorProfile_lastName_firstName_idx" ON "DoctorProfile"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "DoctorProfile_specialization_active_idx" ON "DoctorProfile"("specialization", "active");

-- CreateIndex
CREATE INDEX "DoctorHospital_doctorId_active_idx" ON "DoctorHospital"("doctorId", "active");

-- CreateIndex
CREATE INDEX "DoctorHospital_hospitalId_active_idx" ON "DoctorHospital"("hospitalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorHospital_doctorId_hospitalId_key" ON "DoctorHospital"("doctorId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorHospital_hospitalId_employeeNumber_key" ON "DoctorHospital"("hospitalId", "employeeNumber");

-- CreateIndex
CREATE INDEX "DoctorDepartment_doctorId_active_idx" ON "DoctorDepartment"("doctorId", "active");

-- CreateIndex
CREATE INDEX "DoctorDepartment_departmentId_active_idx" ON "DoctorDepartment"("departmentId", "active");

-- CreateIndex
CREATE INDEX "DoctorDepartment_hospitalId_active_idx" ON "DoctorDepartment"("hospitalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorDepartment_doctorId_departmentId_hospitalId_key" ON "DoctorDepartment"("doctorId", "departmentId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_userId_key" ON "NurseProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_licenseNumber_key" ON "NurseProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "NurseProfile_hospitalId_active_idx" ON "NurseProfile"("hospitalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_hospitalId_employeeNumber_key" ON "NurseProfile"("hospitalId", "employeeNumber");

-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_dayOfWeek_active_idx" ON "DoctorSchedule"("doctorId", "dayOfWeek", "active");

-- CreateIndex
CREATE INDEX "DoctorSchedule_departmentId_dayOfWeek_idx" ON "DoctorSchedule"("departmentId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DoctorSchedule_hospitalId_dayOfWeek_idx" ON "DoctorSchedule"("hospitalId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSchedule_doctorId_departmentId_dayOfWeek_startTime_en_key" ON "DoctorSchedule"("doctorId", "departmentId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "ScheduleException_doctorId_date_idx" ON "ScheduleException"("doctorId", "date");

-- CreateIndex
CREATE INDEX "ScheduleException_hospitalId_date_idx" ON "ScheduleException"("hospitalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_doctorId_hospitalId_date_exceptionType_st_key" ON "ScheduleException"("doctorId", "hospitalId", "date", "exceptionType", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "AppointmentSlot_doctorId_date_status_idx" ON "AppointmentSlot"("doctorId", "date", "status");

-- CreateIndex
CREATE INDEX "AppointmentSlot_departmentId_date_idx" ON "AppointmentSlot"("departmentId", "date");

-- CreateIndex
CREATE INDEX "AppointmentSlot_hospitalId_date_idx" ON "AppointmentSlot"("hospitalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSlot_doctorId_date_startTime_endTime_key" ON "AppointmentSlot"("doctorId", "date", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentNumber_key" ON "Appointment"("appointmentNumber");

-- CreateIndex
CREATE INDEX "Appointment_patientId_appointmentDate_idx" ON "Appointment"("patientId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_appointmentDate_status_idx" ON "Appointment"("doctorId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_appointmentDate_status_idx" ON "Appointment"("hospitalId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "Appointment_departmentId_appointmentDate_idx" ON "Appointment"("departmentId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_appointmentSlotId_idx" ON "Appointment"("appointmentSlotId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "VitalRecord_patientId_recordedAt_idx" ON "VitalRecord"("patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "VitalRecord_appointmentId_idx" ON "VitalRecord"("appointmentId");

-- CreateIndex
CREATE INDEX "VitalRecord_hospitalId_recordedAt_idx" ON "VitalRecord"("hospitalId", "recordedAt");

-- CreateIndex
CREATE INDEX "TriageRecord_appointmentId_createdAt_idx" ON "TriageRecord"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "TriageRecord_patientId_createdAt_idx" ON "TriageRecord"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "TriageRecord_hospitalId_createdAt_idx" ON "TriageRecord"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "SymptomAssessment_patientId_createdAt_idx" ON "SymptomAssessment"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "SymptomAssessment_hospitalId_createdAt_idx" ON "SymptomAssessment"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "SymptomAssessment_appointmentId_idx" ON "SymptomAssessment"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_appointmentId_key" ON "Consultation"("appointmentId");

-- CreateIndex
CREATE INDEX "Consultation_patientId_createdAt_idx" ON "Consultation"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Consultation_doctorId_createdAt_idx" ON "Consultation"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "Consultation_hospitalId_createdAt_idx" ON "Consultation"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_hospitalId_createdAt_idx" ON "Notification"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_hospitalId_createdAt_idx" ON "AuditLog"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientHospitalRecord" ADD CONSTRAINT "PatientHospitalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientHospitalRecord" ADD CONSTRAINT "PatientHospitalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCard" ADD CONSTRAINT "PatientCard_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCard" ADD CONSTRAINT "PatientCard_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCard" ADD CONSTRAINT "PatientCard_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorHospital" ADD CONSTRAINT "DoctorHospital_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorHospital" ADD CONSTRAINT "DoctorHospital_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDepartment" ADD CONSTRAINT "DoctorDepartment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDepartment" ADD CONSTRAINT "DoctorDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDepartment" ADD CONSTRAINT "DoctorDepartment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseProfile" ADD CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseProfile" ADD CONSTRAINT "NurseProfile_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientCardId_fkey" FOREIGN KEY ("patientCardId") REFERENCES "PatientCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_appointmentSlotId_fkey" FOREIGN KEY ("appointmentSlotId") REFERENCES "AppointmentSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRecord" ADD CONSTRAINT "TriageRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRecord" ADD CONSTRAINT "TriageRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRecord" ADD CONSTRAINT "TriageRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRecord" ADD CONSTRAINT "TriageRecord_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomAssessment" ADD CONSTRAINT "SymptomAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomAssessment" ADD CONSTRAINT "SymptomAssessment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomAssessment" ADD CONSTRAINT "SymptomAssessment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomAssessment" ADD CONSTRAINT "SymptomAssessment_recommendedDepartmentId_fkey" FOREIGN KEY ("recommendedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Phase 2 integrity checks that Prisma schema syntax cannot currently express.
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_valid_hours_check" CHECK ("startTime" < "endTime");
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_capacity_check" CHECK ("dailyCapacity" >= 1);
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_valid_hours_check" CHECK ("startTime" < "endTime");
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_capacity_check" CHECK ("consultationDurationMinutes" >= 1 AND "maximumPatients" >= 1);
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_valid_hours_check" CHECK ("startTime" < "endTime");
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_capacity_check" CHECK ("capacity" >= 1 AND "bookedCount" >= 0 AND "bookedCount" <= "capacity");
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_hours_check" CHECK ("startTime" < "endTime");
