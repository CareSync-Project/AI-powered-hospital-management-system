# Database Design

CareSync retains one active `Hospital` record for relational integrity. `NurseDepartment` is the normalized many-to-many department assignment with uniqueness and active state. `NurseAppointmentAssignment` links nurses to visits, records the assigning user and timestamps, and deliberately does not permanently attach a patient to a nurse.

## Principles

The schema is normalized around global users/patients and explicit hospital relationships. UUID primary keys, foreign keys, compound uniqueness, selected indexes, enums, timestamps, and server-side validation protect integrity. PostgreSQL remains authoritative. No model stores a plaintext password, and ordinary user repository results exclude `passwordHash`.

## Entity catalogue

| Entity | Purpose and principal fields | Foreign keys and relationships | Uniqueness and indexes | Deletion strategy |
|---|---|---|---|---|
| `User` | Login identity: email, password hash, role, active/email verification, last login | Optional 1:1 admin/patient/doctor/nurse profiles; notifications, audits, recorded vitals | PK `id`; unique email; role/active index | Profile and historical references restrict deletion; deactivate instead |
| `Hospital` | Facility identity/contact: code, name, address, city, region, country, phone, email, active | Parent of profiles, departments, schedules, cards, appointments and clinical records | Unique code/email; name and region/active indexes | Related operational/medical data restrict deletion; set inactive |
| `AdminProfile` | Hospital administrator identity and employee number | 1:1 User; many:1 Hospital; verifies cards | Unique user; hospital+employee number | User/hospital restricted; card verifier becomes null if appropriate |
| `PatientProfile` | Global patient demographics/contact, no hospital owner | 1:1 User; records, cards, appointments, vitals, triage, assessments, consultations | Unique user; name and active indexes | Medical relationships restrict deletion; deactivate |
| `PatientHospitalRecord` | Hospital-specific patient membership/number | many:1 Patient and Hospital | Unique hospital+patient number and patient+hospital; status index | Both parents restricted |
| `PatientCard` | Manual hospital/NHIS card submission and verification | Patient, Hospital, optional verifying Admin, optional appointments | Unique hospital+type+number; patient and verification indexes | Patient/hospital restricted; admin/appointment links can be set null |
| `Department` | Hospital-managed clinical department | many:1 Hospital; schedules, doctor assignments, slots, appointments | Unique hospital+name and hospital+code; hospital/active index | Hospital and dependent history restricted; deactivate |
| `DepartmentSchedule` | Recurring department clinic hours/capacity | Department and Hospital | Unique department/day/time range; hospital/day and department indexes | Parents restricted |
| `DoctorProfile` | Global clinician profile/license/specialization | 1:1 User; affiliations, assignments, schedules, slots, appointments, consultations | Unique user/license; name and specialty indexes | Historical clinical references restrict deletion; deactivate |
| `DoctorHospital` | Doctor-to-hospital affiliation | Doctor and Hospital | Unique doctor+hospital and hospital+employee number; active indexes | Parents restricted; end/deactivate affiliation |
| `DoctorDepartment` | Doctor assignment to a hospital department | Doctor, Department, Hospital | Unique doctor+department+hospital; targeted active indexes | Parents restricted; deactivate assignment |
| `NurseProfile` | Hospital nurse identity/license | 1:1 User; many:1 Hospital; triage records | Unique user/license and hospital+employee number | Hospital/user/triage references restrict deletion; deactivate |
| `DoctorSchedule` | Recurring doctor hours and capacity | Doctor, Department, Hospital | Unique doctor+department+day/time; doctor/day, department/day, hospital/day indexes | Parents restricted; deactivate schedule |
| `ScheduleException` | Leave, absence, holiday, or custom hours | Doctor and Hospital | Unique doctor/hospital/date/type/time; doctor/date and hospital/date indexes | Parents restricted |
| `AppointmentSlot` | Dated bookable capacity | Hospital, Department, Doctor; optional appointments | Unique doctor/date/start/end; doctor/date/status and facility indexes | Parents restricted; appointments retain slot via `SET NULL` |
| `Appointment` | Booking and workflow timestamps/status | Patient, Hospital, Department, Doctor; optional Card/Slot; clinical children | Unique human appointment number; patient/doctor/hospital/department/date/status indexes | Core parents restricted; card/slot nullable; medical children restrict deletion |
| `VitalRecord` | Measurements, source, verification, recorder | Patient, Hospital, recording User; optional Appointment | Patient/time, hospital/time and appointment indexes | Patient/hospital/user restricted; appointment may become null |
| `TriageRecord` | Repeated triage assessments and urgency | Appointment, Patient, Hospital, Nurse | Appointment/patient/hospital time indexes | All parents restricted; multiple assessments intentionally allowed |
| `SymptomAssessment` | AI-assisted preliminary assessment, never diagnosis | Patient, Hospital; optional Appointment/recommended Department | Patient/hospital time and appointment indexes | Core parents restricted; optional links set null |
| `Consultation` | Clinician observations, diagnosis and treatment | One per Appointment; Patient, Doctor, Hospital | Unique appointment; patient/doctor/hospital time indexes | All parents restricted to retain history |
| `Notification` | User messages and read state | User; optional Hospital | User/read/time and hospital/time indexes | User restricted; hospital may become null |
| `AuditLog` | Security/operational action metadata | User; optional Hospital | User/time, hospital/time, resource and action indexes | User restricted; hospital may become null; no sensitive payload duplication |

## Complete field inventory

Every primary key below is a UUID. Unless stated otherwise, mutable domain entities include `createdAt` and `updatedAt`.

- `User`: `id`, `email`, `passwordHash`, `role`, `active`, `emailVerified`, `lastLoginAt`, `createdAt`, `updatedAt`.
- `Hospital`: `id`, `name`, `hospitalCode`, `address`, `city`, `region`, `country`, `phone`, `email`, `active`, `createdAt`, `updatedAt`.
- `AdminProfile`: `id`, `userId`, `hospitalId`, `employeeNumber`, `firstName`, `lastName`, `phone`, `active`, `createdAt`, `updatedAt`.
- `PatientProfile`: `id`, `userId`, `firstName`, `lastName`, `otherNames`, `dateOfBirth`, `gender`, `phone`, `address`, `city`, `region`, `emergencyContactName`, `emergencyContactPhone`, `active`, `createdAt`, `updatedAt`.
- `PatientHospitalRecord`: `id`, `patientId`, `hospitalId`, `hospitalPatientNumber`, `status`, `firstVisitAt`, `lastVisitAt`, `createdAt`, `updatedAt`.
- `PatientCard`: `id`, `patientId`, `hospitalId`, `cardType`, `cardNumber`, `verificationStatus`, `verifiedByAdminId`, `verifiedAt`, `rejectionReason`, `expiresAt`, `active`, `createdAt`, `updatedAt`.
- `Department`: `id`, `hospitalId`, `name`, `code`, `description`, `active`, `requiresAppointment`, `createdAt`, `updatedAt`.
- `DepartmentSchedule`: `id`, `hospitalId`, `departmentId`, `dayOfWeek`, `startTime`, `endTime`, `dailyCapacity`, `active`, `createdAt`, `updatedAt`.
- `DoctorProfile`: `id`, `userId`, `firstName`, `lastName`, `phone`, `employeeNumber`, `licenseNumber`, `specialization`, `qualification`, `active`, `createdAt`, `updatedAt`.
- `DoctorHospital`: `id`, `doctorId`, `hospitalId`, `employeeNumber`, `active`, `startedAt`, `endedAt`, `createdAt`, `updatedAt`.
- `DoctorDepartment`: `id`, `doctorId`, `departmentId`, `hospitalId`, `primaryDepartment`, `active`, `createdAt`, `updatedAt`.
- `NurseProfile`: `id`, `userId`, `hospitalId`, `employeeNumber`, `firstName`, `lastName`, `phone`, `licenseNumber`, `active`, `createdAt`, `updatedAt`.
- `DoctorSchedule`: `id`, `doctorId`, `departmentId`, `hospitalId`, `dayOfWeek`, `startTime`, `endTime`, `consultationDurationMinutes`, `maximumPatients`, `active`, `createdAt`, `updatedAt`.
- `ScheduleException`: `id`, `doctorId`, `hospitalId`, `date`, `exceptionType`, `reason`, `startTime`, `endTime`, `createdAt`, `updatedAt`.
- `AppointmentSlot`: `id`, `hospitalId`, `departmentId`, `doctorId`, `date`, `startTime`, `endTime`, `capacity`, `bookedCount`, `status`, `createdAt`, `updatedAt`.
- `Appointment`: `id`, `appointmentNumber`, `patientId`, `hospitalId`, `departmentId`, `doctorId`, `patientCardId`, `appointmentSlotId`, `appointmentDate`, `startTime`, `endTime`, `reasonForVisit`, `symptomsSummary`, `urgency`, `bookingMethod`, `status`, `checkedInAt`, `triagedAt`, `consultationStartedAt`, `completedAt`, `cancelledAt`, `cancellationReason`, `createdAt`, `updatedAt`.
- `VitalRecord`: `id`, `patientId`, `appointmentId`, `hospitalId`, `temperature`, `systolicBP`, `diastolicBP`, `heartRate`, `oxygenSaturation`, `respiratoryRate`, `weight`, `height`, `bmi`, `bloodGlucose`, `source`, `verificationStatus`, `recordedByUserId`, `recordedAt`, `createdAt`, `updatedAt`.
- `TriageRecord`: `id`, `appointmentId`, `patientId`, `hospitalId`, `nurseId`, `chiefComplaint`, `triageNotes`, `urgencyLevel`, `createdAt`, `updatedAt`. Multiple assessments per appointment are intentional to retain reassessments.
- `SymptomAssessment`: `id`, `patientId`, `hospitalId`, `appointmentId`, `symptomsText`, `duration`, `severity`, `possibleConditions`, `recommendedDepartmentId`, `urgencyLevel`, `recommendedAction`, `explanation`, `redFlagDetected`, `assessmentVersion`, `createdAt`, `updatedAt`.
- `Consultation`: `id`, `appointmentId`, `patientId`, `doctorId`, `hospitalId`, `chiefComplaint`, `clinicalObservations`, `consultationNotes`, `diagnosis`, `treatmentPlan`, `followUpRequired`, `followUpDate`, `startedAt`, `completedAt`, `createdAt`, `updatedAt`.
- `Notification`: `id`, `userId`, `hospitalId`, `title`, `message`, `type`, `read`, `readAt`, `createdAt`.
- `AuditLog`: `id`, `userId`, `hospitalId`, `action`, `resourceType`, `resourceId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`.

## Integrity not expressible directly in Prisma

Prisma compound constraints prevent duplicate assignments but cannot prove that a referenced department belongs to the duplicated `hospitalId`. Services therefore verify hospital ownership, doctor affiliation, doctor assignment, patient/card ownership, and slot context before writes. Positive capacities and time ordering are validated in API/services and reinforced by explicit PostgreSQL `CHECK` constraints in the generated Phase 2 migration.

## Appointment concurrency

Appointment creation runs in a Prisma interactive transaction at `Serializable` isolation. After reading a slot, it executes `updateMany` constrained by slot ID, current `bookedCount`, and `AVAILABLE` status. Only one concurrent request can update the observed count; a zero-row result becomes HTTP 409 and rolls back. The increment and appointment insert commit together. PostgreSQL serializable conflicts may still require a bounded application retry policy under heavy production load; Phase 2 returns a safe conflict instead of overbooking.

## Medical deletion policy

There are no `Cascade` delete actions. Medical and audit history generally uses `Restrict`; optional contextual links use `SetNull`. Operational entities carry `active` or status fields so normal removal is deactivation, cancellation, or closure rather than physical deletion.
