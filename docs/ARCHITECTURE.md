# Project Architecture

## Phase 6 clinical layer

Appointment workflow, vital assessment, triage, queue, and consultation services sit between role-protected Express controllers and Prisma. PostgreSQL is authoritative. Conditional updates and serializable transactions protect transitions. Nurse access is hospital-scoped, doctor access follows assignment, patient access follows ownership, and the PWA caches no clinical API response.

## Phase 5 patient self-service

The React patient portal uses modular patient, appointment, card, and notification services through the central in-memory-token API client. Express derives `PatientProfile` from the JWT-backed session. Services enforce ownership and hospital/card/slot relationships; Prisma serializable transactions coordinate appointment, capacity, notification, hospital relationship, and audit changes. PostgreSQL is authoritative. The service worker caches static shell resources only and treats `/api/` as network-only.

## Target context

```text
Patient Website / PWA
        |
        v
React Frontend
        |
        v
REST API
        |
        v
Node.js + Express
        |
        v
Application Services
        |
        +---------------------------+
        |                           |
        v                           v
PostgreSQL                    AI Services
via Prisma                    (later phase)
        |
        v
Hospital Information
```

The Patient Dashboard, Doctor Dashboard, future Nurse/Triage Dashboard, and Admin Dashboard will all communicate with the same backend. The API—not the browser—will enforce identity, role, hospital scope, record ownership, and workflow rules.

## Current Phase 3 boundaries

The React client is preserved under `client/`. Identity now comes from PostgreSQL through Express: bcrypt credentials, short-lived in-memory JWT access tokens, and hashed rotatable `AuthSession` refresh tokens in HttpOnly cookies. Protected routes load the active user and enforce role, hospital, ownership, or care relationships. Existing non-auth operational dashboard data remains in `localStorage` for phased migration; it no longer controls authenticated identity.

## Backend layers

- **Routes** map HTTP methods/paths to controllers.
- **Validators** define trusted request shapes at the API boundary.
- **Controllers** translate HTTP input/output and delegate business work.
- **Services** enforce use cases, authorization-aware workflow rules, and transactions.
- **Repositories** encapsulate Prisma persistence queries where abstraction improves testing and consistency.
- **Middleware** handles cross-cutting behavior such as authentication, authorization, errors, request limits, and logging.
- **Prisma/PostgreSQL** provide authoritative persistent data.

Controllers should not contain business rules, and React components should not query Prisma or decide authorization. Sensitive results should be minimized and serialized through explicit response shapes.

## Frontend organization

Current pages and UI are intentionally preserved. `AuthContext` restores the secure cookie session, keeps access tokens in memory, and exposes authoritative user/profile context. The central API client includes credentials, adds bearer tokens, performs one refresh/retry on 401, and clears auth if refresh fails. Route guards use uppercase backend roles and a protected nurse placeholder is present.

## Initial data relationships

Users are global identities with role-specific optional profiles. Patients have no owning hospital and join facilities through `PatientHospitalRecord`, cards, appointments, and clinical records. Doctors join hospitals through `DoctorHospital` and departments through `DoctorDepartment`. Admin and nurse profiles have one hospital in the academic prototype. Cross-table facility consistency is enforced in services where Prisma cannot express it directly.

## Phase 4 scheduling flow

Hospital configuration flows through `Department`, `DepartmentSchedule`, `DoctorDepartment`, `DoctorSchedule`, `ScheduleException`, and generated `AppointmentSlot` records. Admin management services derive hospital scope from authentication. Public discovery uses reduced DTOs; doctor private schedule context requires the authenticated doctor. React management components call central service modules rather than Prisma or repeated direct fetch calls.

## Security architecture

- Passwords are bcrypt-hashed on the server and never returned.
- JWT access tokens expire after 15 minutes; seven-day refresh sessions are hashed, rotated and revocable.
- Enforce RBAC and hospital/record scope on every protected endpoint.
- Validate all untrusted input and constrain body/upload sizes.
- Use TLS in deployed environments, environment-managed secrets, least-privilege database credentials, audit logging, and safe error responses.
- Keep private medical responses out of service-worker caches.
- Treat later AI output as assistive, explainable, non-diagnostic, and subject to clinical/safety review.

## Phase 7 decision-support layer

`React patient symptom form -> authenticated REST endpoint -> normalization -> red-flag screening -> deterministic condition rules -> real hospital department resolution -> PostgreSQL SymptomAssessment`.

Emergency screening precedes ordinary ranking. Linked assessments are visible only through patient ownership or an appointment-based nurse/doctor care relationship. This layer cannot update `TriageRecord.urgencyLevel` or any `Consultation` diagnosis/treatment field. All symptom API responses remain network-only under the PWA service-worker policy.

Phase 7.1 adds a private FastAPI inference process behind Node. React never calls it directly. Node retains authentication, red flags, department resolution, persistence, auditing, and fallback. The Care Assistant uses deterministic intents and controlled service tools; it has no direct SQL facility.

## Deployment direction

Deployment is Phase 8. The client and API will have separate environment configuration, while PostgreSQL remains private to the backend. Production CORS, proxy trust, observability, backups, migrations, rate limiting, and secret management must be configured and tested at deployment time rather than inferred from development defaults.
