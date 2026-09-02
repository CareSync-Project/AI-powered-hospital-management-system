-- The historical PostgreSQL enum value may remain to avoid unsafe enum recreation,
-- but no active SUPER_ADMIN account or application path remains.
DELETE FROM "AuthSession" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role"::text = 'SUPER_ADMIN');
DELETE FROM "AuditLog" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role"::text = 'SUPER_ADMIN');
DELETE FROM "User" WHERE "role"::text = 'SUPER_ADMIN';

-- Recreate the enum with only the four final CareSync roles. This is safe after
-- the historical SUPER_ADMIN account and sessions have been removed above.
CREATE TYPE "UserRole_caresync" AS ENUM ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_caresync" USING ("role"::text::"UserRole_caresync");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_caresync" RENAME TO "UserRole";

CREATE TABLE "NurseDepartment" (
  "id" UUID NOT NULL,
  "nurseId" UUID NOT NULL,
  "departmentId" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NurseDepartment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NurseDepartment_nurseId_departmentId_key" ON "NurseDepartment"("nurseId", "departmentId");
CREATE INDEX "NurseDepartment_departmentId_active_idx" ON "NurseDepartment"("departmentId", "active");
CREATE INDEX "NurseDepartment_nurseId_active_idx" ON "NurseDepartment"("nurseId", "active");
ALTER TABLE "NurseDepartment" ADD CONSTRAINT "NurseDepartment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NurseDepartment" ADD CONSTRAINT "NurseDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "NurseAppointmentAssignment" (
  "id" UUID NOT NULL,
  "nurseId" UUID NOT NULL,
  "appointmentId" UUID NOT NULL,
  "assignedByUserId" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unassignedAt" TIMESTAMP(3),
  CONSTRAINT "NurseAppointmentAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NurseAppointmentAssignment_nurseId_appointmentId_key" ON "NurseAppointmentAssignment"("nurseId", "appointmentId");
CREATE INDEX "NurseAppointmentAssignment_appointmentId_active_idx" ON "NurseAppointmentAssignment"("appointmentId", "active");
CREATE INDEX "NurseAppointmentAssignment_nurseId_active_idx" ON "NurseAppointmentAssignment"("nurseId", "active");
ALTER TABLE "NurseAppointmentAssignment" ADD CONSTRAINT "NurseAppointmentAssignment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NurseAppointmentAssignment" ADD CONSTRAINT "NurseAppointmentAssignment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NurseAppointmentAssignment" ADD CONSTRAINT "NurseAppointmentAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Hospital" SET "name" = 'CareSync Hospital' WHERE "active" = true;
