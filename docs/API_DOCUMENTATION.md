# API Documentation

## System-owner endpoints

| Method/path | Role | Purpose |
|---|---|---|
| `GET /super-admin/hospitals` | Super Admin | List hospitals for administrator assignment |
| `GET /super-admin/admins` | Super Admin | List hospital administrators |
| `POST /super-admin/admins` | Super Admin | Create and assign a hospital administrator |
| `PATCH /super-admin/admins/:userId` | Super Admin | Activate/deactivate an administrator; deactivation revokes sessions |

There is no public Super Admin or hospital-admin registration endpoint.

## Phase 6 clinical endpoints

| Method/path | Role | Purpose |
|---|---|---|
| `GET /clinical/nurse/appointments/today` | Nurse | Hospital-scoped worklist |
| `PATCH /clinical/appointments/:id/check-in` | Nurse/Admin | Controlled check-in |
| `GET/POST /clinical/appointments/:id/vitals` | Nurse/Doctor | Scoped clinical vitals |
| `PATCH /clinical/vitals/:id/verify` | Nurse | Verify patient entry |
| `POST /clinical/appointments/:id/triage` | Nurse | Save triage |
| `PATCH /clinical/appointments/:id/waiting` | Nurse | Enter queue |
| `GET /clinical/doctors/me/queue` | Doctor | Assigned queue |
| `GET /clinical/doctors/me/appointments/:id/clinical` | Doctor | Clinical context |
| `PATCH .../:id/start` | Doctor | Start consultation |
| `PATCH .../:id/consultation` | Doctor | Save draft |
| `PATCH .../:id/complete` | Doctor | Complete consultation |
| `GET/POST /patient/vitals` | Patient | Own records/preliminary entry |
| `GET /patient/appointments/:id/progress` | Patient | Own progress |
| `GET /patient/consultations/:id` | Patient | Own finalized summary |

## Phase 5 patient self-service (`/api/patient`)

All endpoints require an authenticated PATIENT; identity comes from the session.

| Method/path | Purpose |
|---|---|
| `GET /hospitals` | Safe active hospital directory |
| `GET /hospitals/:hospitalId/departments` | Departments and clinic days |
| `GET /departments/:departmentId/availability` | Department availability foundation |
| `GET /departments/:departmentId/doctors?date=YYYY-MM-DD` | Safe doctors and slots |
| `GET /recommendation?hospitalId=&departmentId=&date=` | Earliest real slot recommendation |
| `POST /appointments` | Transactional patient booking |
| `GET /appointments` and `GET /appointments/:id` | Own records only |
| `PATCH /appointments/:id/cancel` | Cancel eligible own record |
| `PATCH /appointments/:id/reschedule` | Atomically move to `newSlotId` |
| `GET/POST /cards` | Own masked cards / pending submission |
| `GET/PATCH /profile` | Own profile / safe edits |
| `GET /notifications` | Own notifications |
| `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | Owned read state |

## Phase 3 authentication and authorization

## Status and response convention

Base URL: `http://localhost:5000/api`. Phase 3 enforces authentication and RBAC on sensitive routes. Access tokens use `Authorization: Bearer TOKEN`; refresh cookies require credentialed browser requests.

## Authentication endpoints

| Method and URL | Access | Purpose |
|---|---|---|
| `POST /auth/register` | Public | Create PATIENT user/profile only; successful registrations are not capped |
| `POST /auth/login` | Public; failed-attempt protection | Authenticate and create session/cookie; successful logins do not consume the limit |
| `POST /auth/refresh` | Refresh cookie, rate-limited | Rotate refresh token and issue access token |
| `GET /auth/me` | Authenticated | Authoritative safe role/profile context |
| `POST /auth/logout` | Authenticated | Revoke current session and clear cookie |
| `POST /auth/logout-all` | Authenticated | Revoke all user sessions |
| `POST /auth/change-password` | Authenticated | Verify/change password and rotate current session |
| `POST /admin/doctors` | ADMIN, own hospital | Create doctor account/affiliation/optional assignment |
| `POST /admin/nurses` | ADMIN, own hospital | Create nurse account |

## Phase 4 management and discovery

| Method and URL | Access | Purpose |
|---|---|---|
| `GET /admin/hospital` | ADMIN | Own hospital settings |
| `PATCH /admin/hospital` | ADMIN | Update own hospital |
| `GET /admin/departments` | ADMIN | Own departments, schedules and doctor counts |
| `POST /admin/departments` | ADMIN | Create own-hospital department |
| `POST /admin/departments/:id/schedules` | ADMIN | Create non-overlapping clinic session |
| `PATCH /department-schedules/:id` | ADMIN | Update/deactivate own-hospital session |
| `GET /admin/doctors` | ADMIN | Own-hospital doctor management records |
| `PATCH /admin/doctors/:id` | ADMIN | Whitelisted doctor profile/active update |
| `POST /admin/doctors/:id/departments` | ADMIN | Add/restore department assignment |
| `DELETE /admin/doctors/:id/departments/:departmentId` | ADMIN | Soft-deactivate assignment |
| `POST /admin/doctors/:id/schedules` | ADMIN | Create validated doctor schedule |
| `PATCH /doctor-schedules/:id` | ADMIN | Update/deactivate doctor schedule |
| `GET /admin/doctors/:id/exceptions` | ADMIN | Own-hospital doctor exceptions |
| `POST /admin/doctors/:id/exceptions` | ADMIN | Create leave/unavailable/custom-hours/holiday |
| `PATCH /schedule-exceptions/:id` | ADMIN | Update own-hospital exception |
| `POST /admin/doctors/:id/generate-slots` | ADMIN | Safely generate/regenerate date slots |
| `GET /doctors/me/schedule` | DOCTOR | Own private schedule and upcoming exceptions |
| `GET /doctors/:id/available-slots?date=YYYY-MM-DD` | Public | Safe available doctor slots |
| `GET /departments/:id/available-slots?date=YYYY-MM-DD` | Public | Safe available department slots |

Registration accepts `email`, `password`, `confirmPassword`, `firstName`, `lastName`, optional `otherNames`, `phone`, `dateOfBirth`, and `gender`. A supplied staff role is rejected. Login role always comes from PostgreSQL.

Errors consistently use `400` validation, `401` authentication/credentials, `403` authorization, `404` missing resource, `409` conflict, `429` limit, and sanitized `500`.

Success:

```json
{ "success": true, "data": {} }
```

Validation failure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "source": "body", "path": "email", "message": "Invalid email address" }]
}
```

Common errors are `400` invalid relationships/input, `404` missing resource, `409` unique/capacity/schedule conflict, and `500` sanitized internal error. Prisma stacks and password hashes are not returned.

## Endpoint catalogue

| Method and URL | Purpose | Request body and validation | Success | Common errors |
|---|---|---|---|---|
| `GET /health` | Process health; no DB query | None | `200`, required running message | `500` startup failure |
| `GET /hospitals` | List hospitals | None | `200` array | `500` DB unavailable |
| `GET /hospitals/:id` | Get hospital UUID | UUID path | `200` hospital | `400`, `404` |
| `POST /hospitals` | System provisioning only; ordinary admin request rejected | Hospital body below | Not exposed in Phase 3 | `403` |
| `PATCH /hospitals/:id` | ADMIN updates own hospital | UUID; whitelisted fields | `200` hospital | `403`, `404`, `409` |
| `GET /hospitals/:hospitalId/departments` | List facility departments | Hospital UUID | `200` array | `400` |
| `POST /hospitals/:hospitalId/departments` | ADMIN creates in own hospital | Department body below | `201` department | `403`, `404`, `409` duplicate name/code |
| `GET /departments/:id` | Get department | UUID path | `200` department | `400`, `404` |
| `PATCH /departments/:id` | ADMIN updates own-hospital department | UUID; at least one department field | `200` department | `403`, `404`, `409` |
| `GET /hospitals/:hospitalId/doctors` | List actively affiliated doctors | Hospital UUID | `200` doctors/affiliations/assignments | `400` |
| `GET /doctors/:id` | Get doctor | UUID path | `200` doctor | `400`, `404` |
| `POST /doctors/:id/affiliations` | Phase 2 affiliation foundation; account creation remains Phase 3 | Hospital UUID, employee number, start date | `201` affiliation | `400`, `409` |
| `POST /doctors/:id/departments` | Assign affiliated doctor to department | Hospital/department UUIDs, flags | `201` assignment | `400` cross-hospital/not affiliated, `409` duplicate |
| `GET /departments/:departmentId/schedules` | List recurring department schedules | Department UUID | `200` array | `400` |
| `POST /departments/:departmentId/schedules` | Add department schedule foundation | Schedule body; start before end | `201` schedule | `400`, `409` duplicate |
| `GET /doctors/:doctorId/schedules` | List doctor schedules | Doctor UUID | `200` array | `400` |
| `POST /doctors/:doctorId/schedules` | Add doctor schedule foundation | Schedule body; affiliation/assignment and overlap checks | `201` schedule | `400`, `409` overlap/duplicate |
| `GET /patients/:id` | Scoped patient profile | Authenticated ownership/care/hospital relationship | `200` safe profile | `401`, `403`, `404` |
| `GET /patients/:patientId/cards` | Patient lists own masked cards | Authenticated PATIENT owner | `200` masked array | `401`, `403` |
| `POST /patients/:patientId/cards` | Patient submits own card | Authenticated PATIENT owner | `201` masked pending card | `403`, `404`, `409`; no external NHIS call |
| `PATCH /patient-cards/:id/verification` | ADMIN manually verifies own-hospital card | Status/reason; verifier derived | `200` masked card | `403`, `404` |
| `GET /appointments` | Role-scoped appointment list | Authenticated; client identity filters overridden | `200` array | `401`, `403` |
| `GET /appointments/:id` | Relationship-scoped appointment | Authenticated owner/assignee/hospital staff | `200` appointment | `403`, `404` |
| `POST /appointments` | Transactional appointment foundation | PATIENT identity derived or own-hospital staff flow | `201` appointment | `403`, `409` capacity/concurrency |
| `GET /patients/:patientId/vitals` | Relationship-scoped vitals | Authenticated | `200` array | `403`, `404` |
| `POST /patients/:patientId/vitals` | Patient stores own unverified measurements | Authenticated PATIENT owner | `201` vital record | `403`, `404`; performs no diagnosis |

## Request bodies

Hospital creation requires `name`, `hospitalCode`, `address`, `city`, `region`, `country`, `phone`, and valid `email`; `active` defaults true. Codes are uppercased. Patch accepts any non-empty subset.

Department creation requires `name` and alphanumeric/hyphen `code`; optional `description`, `active`, and `requiresAppointment`. Name/code are unique inside a hospital.

Department schedule creation:

```json
{ "hospitalId": "uuid", "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "16:00", "dailyCapacity": 40, "active": true }
```

Doctor schedule adds `hospitalId`, `departmentId`, `dayOfWeek`, `startTime`, `endTime`, `consultationDurationMinutes`, `maximumPatients`, and optional `active`. The doctor ID comes from the URL.

Patient card creation:

```json
{ "hospitalId": "uuid", "cardType": "NHIS_CARD", "cardNumber": "submitted-number", "expiresAt": "2027-12-31" }
```

Card verification accepts `VERIFIED` or `REJECTED` and requires `rejectionReason` when rejected. The verifier is derived from the authenticated admin; a client-supplied verifier ID is ignored. Verification remains manual and makes no external NHIS claim.

Appointment creation:

```json
{
  "patientId": "uuid",
  "hospitalId": "uuid",
  "departmentId": "uuid",
  "doctorId": "uuid",
  "patientCardId": null,
  "appointmentSlotId": "uuid-or-null",
  "appointmentDate": "2026-09-07",
  "startTime": "09:00",
  "endTime": "09:20",
  "reasonForVisit": "Routine review",
  "symptomsSummary": "Optional summary",
  "urgency": "ROUTINE",
  "bookingMethod": "STAFF"
}
```

The service validates all patient/hospital/department/doctor/assignment/card/slot relationships. Slot count increment and appointment creation share a serializable transaction.

Patient vitals accept optional positive measurements plus required `hospitalId` and optional `appointmentId`/`recordedAt`. The API forces `source=PATIENT`, `verificationStatus=UNVERIFIED`, and the authenticated recorder. BMI is calculated only when both weight and height are present.

## Phase 7 symptom-assessment endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/patient/symptom-assessments` | PATIENT | Create a rate-limited preliminary rule-based assessment |
| GET | `/api/patient/symptom-assessments` | PATIENT | List the authenticated patient's assessments |
| GET | `/api/patient/symptom-assessments/:id` | PATIENT owner | Read one owned assessment |
| GET | `/api/clinical/appointments/:id/symptom-assessment` | Assigned DOCTOR or same-hospital NURSE | Read appointment-linked pre-visit context |

Creation accepts `hospitalId`, `symptomsText`, optional `symptoms`, optional `duration`, `severity`, voluntary `pregnancyStatus`, and optional `additionalNotes`. Patient identity is derived from authentication. Responses declare the actual assessment method, provide explanations and a disclaimer, and do not return probabilities. A patient booking may include an owned, same-hospital `symptomAssessmentId`; the booking transaction links it after all existing slot and card checks pass.

Phase 7.1 additionally accepts optional `durationDays`, `temperature`, `heartRate`, and `oxygenSaturation` with broad technical validation. Successful model assistance returns `ML_HYBRID`; service failure returns `RULE_BASED_FALLBACK`. Red flags bypass ordinary model inference.

`POST /api/patient/care-assistant/message` accepts a message plus optional hospital/date context. It is PATIENT-only and rate limited. It returns a controlled intent, safe response, optional structured data, limited context, and `requiresConfirmation` for booking handoffs.
