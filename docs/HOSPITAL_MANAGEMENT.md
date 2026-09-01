# Phase 4 Hospital Management

PostgreSQL is authoritative for hospital settings, departments, staff affiliations, assignments and schedules. The Admin dashboard obtains its hospital from the authenticated `AdminProfile.hospitalId`; no frontend hospital ID grants access.

## Hospital settings

`GET /api/admin/hospital` and `PATCH /api/admin/hospital` read/update the authenticated administrator's hospital. Ordinary admins cannot provision new hospitals or switch hospitals.

## Departments and clinic days

Departments support name, code, description, appointment requirement and soft active status. Clinic sessions use `DepartmentSchedule` with day, opening/closing time, capacity and active state. Multiple non-overlapping sessions per day are supported; overlapping active sessions are rejected.

## Doctors

Doctor accounts are created through the Phase 3 secure staff service. Creation transactionally produces the user, profile, own-hospital affiliation and optional initial department. Passwords are bcrypt-hashed and never displayed again. Admin profile changes use whitelisted fields.

Doctors can have multiple department assignments. Duplicate active assignments are rejected. Changing the primary assignment transactionally removes the previous primary flag, giving at most one active primary department per hospital.

## Schedules and exceptions

Doctor schedules require an active hospital affiliation and department assignment. They must fit an active clinic session on the same day and cannot overlap another active doctor schedule. Admins manage `LEAVE`, `HOLIDAY`, `UNAVAILABLE` and `CUSTOM_HOURS`; doctors can view only their own schedule/exception context.

Phase 4 admin pages use the backend for all data in this document. Legacy `hospital_hospitals` and doctor entries in `hospital_users` are obsolete for Phase 4 pages and are not automatically imported. Unrelated appointment/message/ID-request prototype data remains for later phases.
