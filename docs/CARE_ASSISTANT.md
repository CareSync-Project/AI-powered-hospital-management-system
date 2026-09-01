# Care Assistant

## Architecture

The authenticated patient Care Assistant replaces the scripted chatbot as the primary assistant behavior:

`React -> Node authentication/RBAC -> deterministic intent service -> controlled service tools -> PostgreSQL or hybrid symptom service -> safe response`.

No external LLM is configured. `chatbotProviderAdapter.js` truthfully reports deterministic mode and provides an extension boundary for future conversational phrasing. An LLM must never receive credentials, tokens, full card numbers, unrelated history, or unrestricted database access.

## Supported intents

- `HOSPITAL_LIST`
- `DEPARTMENT_LIST`
- `DEPARTMENT_SCHEDULE`
- `DOCTOR_AVAILABILITY`
- `AVAILABLE_SLOTS` through doctor availability results
- `MY_APPOINTMENTS`
- `CARD_STATUS`
- `BOOK_APPOINTMENT`
- `SYMPTOM_CHECK`
- `GENERAL_HEALTH_INFO`
- `HELP` and safe unknown fallback

## Controlled tools and security

Tools call existing service-layer operations for active hospitals, departments, stored schedules, available doctor slots, authenticated-patient appointments, masked cards, and symptom assessment. The request schema rejects arbitrary patient IDs. Patient identity is always derived from authentication. There is no arbitrary SQL tool.

Small conversational context retains only hospital, department, and date identifiers in server memory. Raw chat history is not written to localStorage or PostgreSQL. The PWA service worker treats API responses as network-only.

## Booking and clinical safety

“Book” requests prepare a handoff and require final confirmation in the existing booking wizard. The assistant cannot silently reserve a slot. Symptom messages use the same red-flag-first hybrid service as the symptom page. The assistant cannot diagnose, prescribe medication or dosage, write doctor diagnosis, alter nurse triage, or ignore emergency output.

The landing-page helper now directs users to sign in for the controlled Care Assistant and no longer makes simulated matching or wait-time claims.

