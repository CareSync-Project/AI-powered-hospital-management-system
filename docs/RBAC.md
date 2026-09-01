# Role-Based and Scoped Authorization

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
