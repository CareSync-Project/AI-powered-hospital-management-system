# Current System Audit

## Audit scope

This audit covers every file present before Phase 1 restructuring: the root Vite configuration and HTML entry point; `src/App.jsx`, both CSS files, Firebase configuration, two contexts, four pages, three source assets; six public assets; package manifests; Netlify configuration; and repository metadata files. The project did not contain a Git repository, backend, tests, hooks directory, services directory, or database schema.

## 1. Existing technologies

- React 19 with Vite 8 and React DOM
- React Router 7 (`BrowserRouter`, declarative routes, redirects)
- Lucide React icons and Framer Motion animation
- SheetJS (`xlsx`) for browser-side CSV/XLSX reading
- Firebase SDK configuration for Auth and Firestore, although no active module imports it
- CSS with shared variables/utilities plus extensive inline component styles
- Browser `localStorage` as the operational prototype data store
- Netlify SPA redirect/build configuration
- Oxlint configuration

## 2. Existing modules

| Area | File/module | Responsibility |
|---|---|---|
| Application | `client/src/App.jsx` | Providers, routes, and role checks for patient/doctor/admin pages |
| Landing/auth UI | `client/src/pages/LandingPage.jsx` | Marketing page, modal login/registration, hospital registration, scripted chatbot |
| Patient | `client/src/pages/PatientDashboard.jsx` | Booking, doctor selection, appointments, hospital IDs, inbox |
| Doctor | `client/src/pages/DoctorDashboard.jsx` | Doctor queue, consultation timer, completion notes |
| Admin | `client/src/pages/AdminDashboard.jsx` | Metrics, ID approval, doctor association, bulk import |
| Authentication | `client/src/context/AuthContext.jsx` | Prototype registration/login/session in local storage |
| Notifications | `client/src/context/NotificationContext.jsx` | Temporary on-screen simulated SMS/email notices |
| Firebase | `client/src/firebase.js` | Environment-based Firebase Auth/Firestore initialization, currently unused |
| Styling | `client/src/index.css` | Active palette, base styles, utility classes, responsive rules |
| Styling | `client/src/App.css` | Unused Vite starter CSS; not imported by the application |

There are no custom hooks. Reusable UI exists as CSS classes and providers, but page markup is largely monolithic and inline; there is no reusable component directory yet.

## 3. Existing working features

Subject to the prototype limitations and a browser-local data set, the code implements:

- Responsive landing page and authentication modal
- Patient, doctor, and administrator registration/login paths
- Client-side route protection based on the role stored in the session object
- Hospital registration with an associated administrator
- Independent doctor registration and administrator association to a hospital
- Patient appointment creation and cancellation
- Keyword-to-specialty mapping followed by least-scheduled-doctor selection
- Estimated wait calculation based on queue length and a user-selected urgency value
- Doctor consultation start/completion and duration capture
- Administrator queue/consultation statistics derived from appointments
- Patient hospital-ID requests, administrator approval, and generated inbox messages
- Patient message read state
- Temporary notification overlays that imitate SMS/email events
- Browser-side doctor/patient CSV or Excel import
- Existing image assets and visual design

During Phase 1 preservation, a missing `CheckCircle` import was fixed and the patient-ID session update was corrected to use the active session key.

## 4. Prototype-only features

- Authentication is a delayed browser lookup, not server authentication.
- Role authorization is a client-side redirect and can be bypassed by editing storage.
- “AI” appointment matching is a fixed keyword dictionary and simple load heuristic; no ML model is trained or evaluated.
- The chatbot is a fixed set of substring responses.
- SMS and email notifications are visual simulations only.
- Urgency is self-selected and directly changes estimated waiting time; it is not clinical triage.
- Hospital-ID “verification” accepts any entered string without checking a hospital system.
- Patient IDs are random strings without collision or identity controls.
- Analytics are calculated from browser-local prototype data and are not validated operational results.
- Consultation timing falls back to a hard-coded 15 minutes if not started.
- Firebase is configured but not connected to any active workflow.

## 5. Current data storage methods

All operational records are JSON in `localStorage`; state is loaded directly inside pages and contexts.

| Storage key | Readers/writers | Stored data | Planned migration |
|---|---|---|---|
| `hospital_users` | Auth context; patient/admin pages | Users, plaintext passwords, roles, doctor metadata, hospital associations, patient hospital IDs | Phase 2 normalized records; Phase 3 bcrypt hashes and authenticated endpoints; later domain profile tables |
| `hospital_auth_user` | Auth context; patient ID flow | Active user/session profile without password | Phase 3 authenticated client state; do not persist sensitive profiles |
| `hospital_appointments` | Patient, doctor, admin pages | Symptoms, appointments, status, consultation notes/duration | Appointment schema/API in later phases; authorize every access server-side |
| `hospital_hospitals` | Auth context; patient page | Hospital name, identifier, creation time | Initial `Hospital` model, then managed hospital API in Phase 4 |
| `hospital_id_requests` | Patient/admin pages | Patient/hospital IDs and request status | Server-owned request workflow with constraints and audit fields in a later phase |
| `hospital_messages` | Patient/admin pages | Patient inbox content/read state | Authorized notification/message tables and APIs in a later phase |
The original patient-ID code also referenced `hospital_current_user`, a key used nowhere else. Phase 1 corrected it to `hospital_auth_user`; no legacy data was deleted.

## 6. Security concerns

Critical concerns:

- Passwords, imported passwords, symptoms, consultation notes, Ghana Card values, and identifiers are stored in readable browser storage.
- Password comparison is plaintext and entirely client-side.
- Users can alter roles, hospital associations, appointments, consultation data, IDs, and messages through browser developer tools.
- There is no server-side authentication, authorization, record ownership, audit trail, rate limiting, or account lockout.
- Hospital-ID entry is labeled verification but performs no verification.
- Bulk-upload content has only positional checks; no robust schema, size, type, or server-side validation.

Additional concerns:

- `JSON.parse` calls are not protected against malformed storage and can crash views.
- Date/ID creation uses local time, `Date.now()`, and `Math.random()`, which are not reliable identifiers or concurrency controls.
- Role values are lowercase in the prototype but uppercase in the planned database enum; migration must map them explicitly.
- The Firebase web configuration uses environment variables, but initializing an unused backend increases dependency/configuration surface.
- External Google Fonts creates a third-party request and should be reviewed for deployment privacy/content-security policy.
- Error handling exposes authentication distinctions and lacks consistent accessible feedback.
- JWT storage strategy is not finalized; local storage is vulnerable to token theft if XSS occurs.

No real secret was found in the inspected repository.

## 7. Code that can be reused

- Page layouts, responsive grid utilities, palette, shared button/input/panel classes, and visual assets
- Existing routing shape and provider composition, after replacing client-only authorization
- Dashboard information architecture and user task flows
- Queue filtering and average-duration calculations as requirements/prototype logic, after moving them server-side and testing them
- Specialty keyword map as a transparent baseline rule set, clearly labeled non-diagnostic and reviewed before later AI work
- Patient-ID request/inbox interaction design
- Sheet import UX, with parsing/validation moved to a controlled backend process
- Environment-driven Firebase module if a later architectural decision retains Firebase for a defined purpose

## 8. Code that should be refactored

- Split large page components into forms, navigation, cards, tables/lists, and feature-specific hooks.
- Replace repeated raw storage reads/writes with API services in workflow-sized migrations.
- Move matching, authorization, wait calculation, ID generation, and analytics to backend application services.
- Replace inline styles with reusable classes/components while preserving the current design.
- Add error boundaries, loading states, accessible dialogs/forms, and storage migration guards.
- Normalize user/hospital/domain profiles rather than accumulating unrelated fields on user objects.
- Introduce backend validators, repositories, services, controllers, authorization middleware, and tests per resource.
- Reconcile role naming and define a server-issued authenticated session.
- Replace prompts and forced page reloads with explicit UI/state updates.

## 9. Code that should eventually be removed

- Plaintext local-storage authentication and sensitive domain records, after verified migrations
- Artificial `setTimeout` delays used to imitate authentication, matching, chatbot, email, and SMS work
- Claims such as “eliminate wait times” or “AI” where implementation/evaluation does not support them
- Unused `App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, and `src/assets/hero.png` after confirming no planned design use
- Firebase dependency and `firebase.js` if PostgreSQL/JWT fully replaces it
- The scripted chatbot if it is not part of assessed scope
- Browser-side password columns in bulk imports

These files and behaviors are documented, not deleted in Phase 1.

## 10. Recommended migration approach

1. Preserve the prototype under `client/` and establish the backend contract alongside it.
2. Review and migrate the `User`/`Hospital` foundation first; use explicit adapters for legacy lowercase roles and string identifiers.
3. Implement bcrypt/JWT authentication and server-side RBAC in Phase 3, then switch `AuthContext` through `authService` in one controlled change.
4. Build hospital, department, doctor, and scheduling resources before appointment migration.
5. Migrate one complete workflow at a time—read, write, authorization, validation, test—retaining legacy keys temporarily for rollback/read-only comparison.
6. Never copy plaintext passwords into PostgreSQL. Require password reset or hash credentials during a controlled migration.
7. Treat symptoms, identifiers, and consultation data as sensitive; minimize collection, use TLS, restrict access, audit changes, and avoid service-worker caching.
8. Add the nurse/triage interface only when its backend permissions and workflow exist.
9. Implement the PWA shell separately from private API caching.
10. Evaluate any recommendation engine against defined data, methods, safety constraints, and measurable results; do not represent current rules as a trained clinical model.

## Broken imports, duplication, and architectural summary

- The original patient dashboard used `CheckCircle` without importing it; fixed in Phase 1.
- Imports otherwise resolve from the inspected source tree.
- `App.css` and three source assets are unused. Firebase exports are also unused.
- Every dashboard duplicates storage parsing/filtering; styling and feature logic are concentrated in giant page files.
- The system has no authoritative server or shared database, so cross-device behavior, concurrency, integrity, confidentiality, and real multi-user operation are absent.
