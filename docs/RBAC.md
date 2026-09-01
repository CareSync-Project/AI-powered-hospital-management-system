# Role-Based and Scoped Authorization

## Phase 6 clinical permissions

| Capability | Patient | Nurse | Doctor | Admin |
|---|---:|---:|---:|---:|
| View vitals | Own | Hospital workflow | Assigned care | No general clinical access |
| Submit preliminary vitals | Own/unverified | — | — | No |
| Record verified vitals | No | Own hospital | Assigned patient | No |
| Check in | No | Own hospital | No | Own hospital operationally |
| Create triage | No | Own hospital | No | No |
| Start/complete consultation | No | No | Assigned appointment | No |
| Write diagnosis/treatment | No | No | Assigned doctor only | No |
| View finalized summary | Own | Workflow context | Assigned care | No general access |

Frontend controls are UX only; backend profile and relationship lookups enforce every permission.

Frontend guards improve navigation only. Express middleware, authenticated profile lookups, and PostgreSQL relationships make every authorization decision. Request bodies cannot select a role, admin hospital, nurse hospital, or patient identity.

| Capability | PATIENT | DOCTOR | NURSE | ADMIN |
|---|---|---|---|---|
| Read public hospital/department/doctor directory | Yes | Yes | Yes | Yes |
| Read patient profile | Own | Assigned-care relationship | Own-hospital active record | Own-hospital active record |
| Read appointments | Own | Assigned | Nurse hospital | Admin hospital |
| Create patient appointment | Own identity derived | No Phase 3 flow | Staff-assisted, own hospital | Staff-assisted, own hospital |
| Submit patient card | Own | No | No | No |
| Verify patient card | No | No | No | Own hospital only |
| Submit patient-entered vitals | Own; forced unverified | No Phase 3 flow | Phase 6 | Phase 6 |
| Manage departments/schedules | No | No | No | Own hospital only |
| Create staff account | No | No | No | Own hospital only |

Patient ownership uses the authenticated `PatientProfile.id`. Admin and nurse scope comes from their role profile, not a supplied `hospitalId`. Doctor patient access requires a non-cancelled/non-missed appointment assigned to that doctor; appointment access always requires exact assignment. Doctor hospital actions require an active affiliation. Nurse clinical write workflows remain Phase 6.

Public endpoints are `GET /api/health`, safe active hospital discovery, active departments, safe doctor directory/profile, and public schedule discovery. All mutation routes and patient/appointment records are protected. Hospital provisioning itself remains a system operation; `POST /api/hospitals` is not available as public or ordinary admin self-provisioning.

## Symptom-assessment permissions

| Capability | PATIENT | DOCTOR | NURSE | ADMIN |
|---|---|---|---|---|
| Create preliminary assessment | Own identity | No | No | No |
| Read assessment history | Own only | No global access | No global access | No |
| Read appointment-linked assessment | Own booking context | Assigned appointment only | Same-hospital workflow only | No general clinical access |
| Change nurse triage | No | No | Authorised triage only | No |
| Write diagnosis from assessment | No | Clinician must enter independently | No | No |

The submitted hospital cannot expand access. Clinical reads verify the actual appointment, assigned doctor, or nurse hospital in PostgreSQL.
