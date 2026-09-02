# CareSync

CareSync is a single-hospital AI-Powered Hospital Management System. Final roles are `ADMIN`, `DOCTOR`, `NURSE`, and `PATIENT`. The configured fictional development facility is CareSync Hospital; the application does not create or switch hospitals.

> Current status: Phases 1–6 are implemented. Phase 6 adds PostgreSQL-backed check-in, vitals, nurse triage, deterministic queues, doctor consultation, follow-up, and patient clinical summaries. AI symptom assessment remains Phase 7 work.

## Project overview

This final-year academic project incrementally develops an existing React hospital-management prototype into a full-stack system with a shared REST API. The preserved prototype currently provides patient, doctor, and administrator interfaces. Phase 1 establishes the repository, API, and PostgreSQL/Prisma foundations without claiming that later clinical, AI, PWA, or deployment features already exist.

## Problem being addressed

Hospital workflows are often fragmented across appointment intake, staff assignment, patient identification, triage, consultation, and administration. This project explores a unified system that can coordinate those workflows and, in a later evaluated phase, provide carefully scoped decision support for appointment routing. It is not a clinical diagnosis system.

## Main project objectives

- Provide role-appropriate interfaces for patients and hospital staff.
- Centralize hospital data behind an authenticated REST API and PostgreSQL database.
- Support appointment and care workflows incrementally with auditable access controls.
- Deliver a responsive, installable patient PWA without caching sensitive medical data.
- Evaluate later AI-assisted recommendations honestly and with appropriate clinical safeguards.

## Main features

Currently preserved prototype features include:

- Landing page, role-based prototype registration/login, and route guards
- Patient, doctor, and hospital administrator dashboards
- Hospital registration and doctor association
- Rule-based symptom-to-specialty matching and least-loaded doctor selection
- Prototype appointment queues, cancellations, consultation completion, and metrics
- Patient hospital-ID request/approval and inbox messages
- Simulated in-app appointment notifications
- Administrator CSV/XLSX import

The backend now includes the Phase 2 relational schema, generated-but-unapplied initial migration, repository/service layers, validated foundational REST endpoints, fictional seed script, and transactional appointment capacity protection. Prototype frontend data remains in browser storage until later phases migrate each workflow.

## Planned user roles

1. Patient
2. Doctor
3. Nurse/Triage Staff
4. Hospital Administrator

The nurse role exists in the initial database role enum, but no nurse dashboard or workflow is implemented in Phase 1.

## Technology stack

- Frontend: React, Vite, React Router, Lucide React, Framer Motion
- Patient mobile system: planned Progressive Web App
- Backend: Node.js, Express.js, REST
- Database: PostgreSQL
- ORM: Prisma ORM
- Authentication: planned JWT with bcrypt password hashing
- Validation: Zod
- Version control: Git and GitHub

## Existing project status

Phase 2 data/backend foundation is implemented. The frontend remains a working prototype under `client/`. Foundational database routes exist but are explicitly unauthenticated development routes until Phase 3; do not publish them. Firebase configuration remains preserved and unused. A real PostgreSQL connection, migration application, and seed execution still require `server/.env`. See [the API documentation](docs/API_DOCUMENTATION.md) and [database design](docs/DATABASE_DESIGN.md).

## Installation

Prerequisites: Node.js 20+, npm, and (for database work) PostgreSQL.

```bash
cd client
npm install
```

In a second terminal:

```bash
cd server
npm install
```

Copy each example environment file to its local `.env` counterpart and provide your own values. Never commit those `.env` files.

## Development commands

Frontend:

```bash
cd client
npm run dev
npm run build
npm run preview
```

Backend:

```bash
cd server
npm run dev
npm start
npm test
```

The frontend defaults to `http://localhost:5173`; the API defaults to `http://localhost:5000`, with health available at `http://localhost:5000/api/health`.

## Folder structure

```text
.
├── client/                 # Preserved React + Vite application
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── context/
│       ├── pages/
│       └── services/       # Backend API service foundation
├── server/
│   ├── prisma/             # Initial Prisma schema and seed entry point
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
└── docs/
```

## Project roadmap

1. Existing project audit, GitHub setup, and full-stack foundation — complete
2. PostgreSQL database and backend development — implementation complete; migration awaits configured PostgreSQL
3. Authentication and role-based access control
4. Hospital, department, doctor, and schedule management
5. Patient appointment booking and PWA
6. Vitals, triage, and doctor consultation workflow
7. AI-assisted symptom assessment and recommendation engine
8. Testing, security, deployment, and final documentation

No Phase 2 work should begin until Phase 1 findings and the data model direction are reviewed.

## Git workflow

- `main`: stable releases only
- `develop`: integrated development work
- `feature/*`: isolated modules, merged into `develop` through review

See [the Git workflow](docs/GIT_WORKFLOW.md) for branch naming and release flow.

## Environment variables

Frontend (`client/.env`):

- `VITE_API_URL`: REST API base URL
- Optional legacy `VITE_FIREBASE_*` values are listed in `client/.env.example`

Backend (`server/.env`):

- `DATABASE_URL`: PostgreSQL connection string (required for Prisma database operations)
- `JWT_SECRET`: a private value of at least 32 characters (required before authentication work)
- `PORT`: API port, default `5000`
- `CLIENT_URL`: allowed browser origin
- `NODE_ENV`: `development`, `test`, or `production`

## Database setup status

The PostgreSQL development database is configured locally, the existing migrations have been applied, and the fictional development seed has been run. Each environment still requires its own private `DATABASE_URL`; no credential is committed. Verify a target environment with:

```bash
cd server
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The last two commands connect to PostgreSQL. See [database setup](docs/DATABASE_SETUP.md) before running them.

## Phase 7 status

Phase 7 adds an authenticated, PostgreSQL-backed, rule-based preliminary symptom assessment. It normalizes common symptom language, screens urgent red flags first, ranks a small set of illustrative possibilities without fake probabilities, resolves recommendations against real hospital departments, integrates non-emergency results with booking, and exposes linked results to authorised nurses/doctors as advisory context. It does not train a machine-learning model, diagnose disease, set nurse triage, or write the doctor's diagnosis.

See [AI symptom assessment](docs/AI_SYMPTOM_ASSESSMENT.md), [knowledge base](docs/SYMPTOM_KNOWLEDGE_BASE.md), and [AI safety](docs/AI_SAFETY.md).

## Phase 7.1 status

The symptom system is now hybrid: Node emergency rules, a measured scikit-learn classifier served by private FastAPI, and a rule-based failure fallback. The authenticated Care Assistant queries real hospital services and hands booking back to the existing confirmation workflow. Model metrics describe only the downloaded public dataset and are not clinical or Ghanaian validation.

See [ML model](docs/ML_MODEL.md) and [Care Assistant](docs/CARE_ASSISTANT.md).
