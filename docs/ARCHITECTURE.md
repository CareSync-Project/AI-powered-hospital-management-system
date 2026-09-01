# Project Architecture

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

## Current Phase 2 boundaries

The React client is preserved under `client/`, and existing feature data still uses `localStorage`; the new REST modules are not wired into those workflows yet. Express now exposes validated foundational hospital, department, doctor, schedule, patient-card, appointment, and vital routes through controllers/services/repositories. The complete Phase 2 Prisma schema and initial migration SQL exist, but no live database migration or seed result is claimed. Authentication and RBAC are deliberately deferred to Phase 3, so non-health routes are development-only.

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

Current pages and UI are intentionally preserved. Incremental refactoring will introduce feature-specific components/hooks and use `client/src/services/api.js` as the single REST transport. `VITE_API_URL` selects the backend origin. The service layer is present but prototype authentication continues to use its original context until the Phase 3 backend exists.

## Initial data relationships

Users are global identities with role-specific optional profiles. Patients have no owning hospital and join facilities through `PatientHospitalRecord`, cards, appointments, and clinical records. Doctors join hospitals through `DoctorHospital` and departments through `DoctorDepartment`. Admin and nurse profiles have one hospital in the academic prototype. Cross-table facility consistency is enforced in services where Prisma cannot express it directly.

## Security architecture direction

- Hash passwords with bcrypt on the server; never store or return plaintext passwords.
- Issue and validate JWT-based sessions in Phase 3, with expiry/refresh/revocation strategy documented before use.
- Enforce RBAC and hospital/record scope on every protected endpoint.
- Validate all untrusted input and constrain body/upload sizes.
- Use TLS in deployed environments, environment-managed secrets, least-privilege database credentials, audit logging, and safe error responses.
- Keep private medical responses out of service-worker caches.
- Treat later AI output as assistive, explainable, non-diagnostic, and subject to clinical/safety review.

## Deployment direction

Deployment is Phase 8. The client and API will have separate environment configuration, while PostgreSQL remains private to the backend. Production CORS, proxy trust, observability, backups, migrations, rate limiting, and secret management must be configured and tested at deployment time rather than inferred from development defaults.
