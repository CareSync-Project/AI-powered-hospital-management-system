# Database Setup

## Assumptions

Use PostgreSQL 15 or newer, Node.js 20+, and a database role that can create tables and indexes in a dedicated development database. PostgreSQL is the source of truth; Firebase and browser storage are not database substitutes.

Create a local database using your preferred PostgreSQL administration tool or, for example:

```sql
CREATE DATABASE ai_hospital_management;
```

Copy `server/.env.example` to `server/.env` and replace placeholders locally:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/ai_hospital_management?schema=public
JWT_SECRET=replace_with_a_private_random_value_of_at_least_32_characters
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Never commit `server/.env` or real credentials.

## Prisma commands

```bash
cd server
npm install
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name phase2_core_hospital_schema
npx prisma db seed
npx prisma studio
```

`migrate dev` and `db seed` require a reachable PostgreSQL database. Schema formatting, validation, and client generation do not prove database connectivity.

## Development seed

The seed is idempotent, fictional, and blocked when `NODE_ENV=production`. It creates VoltaCare Teaching Hospital Demo, departments, schedules, fictional staff/patients/cards, and appointment slots.

Development-only login identifiers use the `.invalid` domain. Their shared local seed password is:

```text
DemoOnly!ChangeMe2026
```

The seeded development system owner is `owner@caresync-demo.invalid`. It uses the development-only password above and must be replaced for any shared or production environment.

The database receives only a bcrypt hash. Change these credentials for any shared environment; they are not production accounts.

## Time and date strategy

- Clinic dates use PostgreSQL `DATE` through Prisma `DateTime @db.Date`.
- Time-of-day values use PostgreSQL `TIME(0)` through `DateTime @db.Time(0)`.
- API inputs use `YYYY-MM-DD` and 24-hour `HH:mm`.
- Audit/event timestamps use PostgreSQL timestamps managed by Prisma and should be interpreted as UTC by application code.

This avoids attaching an arbitrary local timezone to recurring weekly schedules. A hospital timezone field may be added later if multi-country scheduling requires it.

## Known local tooling issue

On the current Windows environment, `npm run lint` in `client/` fails before analyzing source because Oxlint cannot load `@oxlint/binding-win32-x64-msvc`; Windows reports that `oxlint.win32-x64-msvc.node` is not a valid Win32 application. Both an optional-dependency reinstall and a targeted matching-version reinstall were attempted. The application build is unaffected. A clean `client/node_modules` and lockfile reinstall on another supported Node/Windows environment is the next reasonable repair; the lint stack was not replaced in Phase 2.
