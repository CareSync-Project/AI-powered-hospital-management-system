# Phase 2 API Documentation

## Status and response convention

Base URL: `http://localhost:5000/api`. Except for health, Phase 2 routes are development foundations and are **not authenticated**; responses include `X-Phase2-Authentication: not-enforced-development-foundation`. Do not expose them publicly. Phase 3 will add authentication, ownership and RBAC middleware without moving business rules into routes.

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
| `POST /hospitals` | Create hospital | Hospital body below | `201` hospital | `400`, `409` code/email |
| `PATCH /hospitals/:id` | Update/deactivate hospital; no delete route | UUID; at least one hospital field | `200` hospital | `400`, `404`, `409` |
| `GET /hospitals/:hospitalId/departments` | List facility departments | Hospital UUID | `200` array | `400` |
| `POST /hospitals/:hospitalId/departments` | Create facility department | Department body below | `201` department | `400`, `404`, `409` duplicate name/code |
| `GET /departments/:id` | Get department | UUID path | `200` department | `400`, `404` |
| `PATCH /departments/:id` | Update/deactivate department | UUID; at least one department field | `200` department | `400`, `404`, `409` |
| `GET /hospitals/:hospitalId/doctors` | List actively affiliated doctors | Hospital UUID | `200` doctors/affiliations/assignments | `400` |
| `GET /doctors/:id` | Get doctor | UUID path | `200` doctor | `400`, `404` |
| `POST /doctors/:id/affiliations` | Phase 2 affiliation foundation; account creation remains Phase 3 | Hospital UUID, employee number, start date | `201` affiliation | `400`, `409` |
| `POST /doctors/:id/departments` | Assign affiliated doctor to department | Hospital/department UUIDs, flags | `201` assignment | `400` cross-hospital/not affiliated, `409` duplicate |
| `GET /departments/:departmentId/schedules` | List recurring department schedules | Department UUID | `200` array | `400` |
| `POST /departments/:departmentId/schedules` | Add department schedule foundation | Schedule body; start before end | `201` schedule | `400`, `409` duplicate |
| `GET /doctors/:doctorId/schedules` | List doctor schedules | Doctor UUID | `200` array | `400` |
| `POST /doctors/:doctorId/schedules` | Add doctor schedule foundation | Schedule body; affiliation/assignment and overlap checks | `201` schedule | `400`, `409` overlap/duplicate |
| `GET /patients/:id` | Get global patient profile | Patient UUID | `200` profile; no password hash | `400`, `404`; Phase 3 ownership required |
| `GET /patients/:patientId/cards` | List masked patient cards | Patient UUID | `200` array with only last four digits visible | `400`; Phase 3 ownership required |
| `POST /patients/:patientId/cards` | Submit card for manual verification | Card body below | `201` masked pending card | `400`, `404`, `409`; no external NHIS call |
| `PATCH /patient-cards/:id/verification` | Manual verification foundation, future admin-only | Status/admin UUID/reason | `200` masked card | `400`, `404`; Phase 3 admin RBAC required |
| `GET /appointments` | Development list/filter | Optional patientId, doctorId, hospitalId, departmentId, status | `200` array | `400`; Phase 3 scope required |
| `GET /appointments/:id` | Get appointment | UUID path | `200` appointment | `400`, `404`; Phase 3 scope required |
| `POST /appointments` | Transactional appointment foundation | Appointment body below | `201` appointment | `400` relationship mismatch, `404`, `409` capacity/concurrency |
| `GET /patients/:patientId/vitals` | List patient vitals | Patient UUID | `200` array | `400`; Phase 3 ownership required |
| `POST /patients/:patientId/vitals` | Store measurements and calculate BMI | Vitals body below | `201` vital record | `400`, `404`; performs no diagnosis |

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

Card verification accepts `VERIFIED` or `REJECTED`, `verifiedByAdminId`, and requires `rejectionReason` when rejected. Verification is manual/prototype only.

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

Vitals accept optional positive measurements (`temperature`, blood pressures, heart/respiratory rate, oxygen saturation, weight kg, height cm, blood glucose), plus required `hospitalId`, `source`, and `recordedByUserId`; optional `appointmentId`, `verificationStatus`, and `recordedAt`. Patient-sourced data is forced to `UNVERIFIED`. BMI is calculated only when both weight and height are present.
