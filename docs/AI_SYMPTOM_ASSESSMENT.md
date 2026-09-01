# AI-Assisted Symptom Assessment

## Scope

Phase 7 adds an explainable, deterministic, rule-based preliminary symptom assessment. It helps a patient decide which hospital department may be suitable and whether prompt review is advisable. It is not a diagnosis, does not replace a clinician, and does not use a trained machine-learning model.

## Patient flow

1. An authenticated patient selects a hospital.
2. The patient provides free-text symptoms, optional structured symptoms, duration, severity, and voluntary pregnancy context.
3. The backend normalizes common terms and synonyms.
4. Emergency red flags are screened before routine condition matching.
5. A small curated knowledge base ranks up to five illustrative possibilities.
6. A department category is selected and resolved against real active departments at the chosen hospital. General OPD is the safe fallback.
7. The result is stored in PostgreSQL and returned with an explicit disclaimer.
8. A non-emergency result can prefill the Phase 5 booking wizard. The selected slot is still validated by the existing booking transaction.

## API

- `POST /api/patient/symptom-assessments` — authenticated patient only; rate limited to 30 submissions per 15 minutes per process instance.
- `GET /api/patient/symptom-assessments` — current patient's history only.
- `GET /api/patient/symptom-assessments/:id` — current patient's assessment only.
- `GET /api/clinical/appointments/:id/symptom-assessment` — assigned doctor or same-hospital nurse only.

The assessment creation endpoint derives `patientId` from the authenticated session. It rejects unknown fields, including a client-supplied patient identity.

## Example response

```json
{
  "assessmentMethod": "RULE_BASED",
  "assessmentVersion": "rule-v1.0",
  "urgency": "MODERATE",
  "possibleConditions": [],
  "recommendedDepartmentCategory": "GENERAL",
  "recommendedDepartment": { "id": "...", "name": "General OPD" },
  "recommendedAction": "Arrange a clinical review.",
  "redFlagDetected": false,
  "disclaimer": "This preliminary rule-based assessment is not a medical diagnosis..."
}
```

## Emergency behavior

Red-flag matching runs first. Severe breathing difficulty, severe chest pain, unconsciousness, seizures, stroke-like signs, severe bleeding, suicidal intent, and pregnancy bleeding can produce an emergency result. The UI prominently advises urgent professional care and does not show the ordinary booking shortcut. The system does not diagnose the cause and does not claim emergency-service integration.

## Booking and clinical workflow integration

An assessment can be linked to one appointment belonging to the same authenticated patient and hospital. It then appears as a clearly labelled pre-visit decision-support summary to the assigned doctor and same-hospital nurse. It never writes `Consultation.diagnosis`, never creates or changes nurse triage urgency, and never completes an appointment.

## Privacy and PWA behavior

Assessment API traffic uses the authenticated central API client. The service worker treats all `/api/` requests as network-only and does not intentionally cache symptom or clinical responses. Assessment data is not stored in localStorage. Audit metadata contains identifiers and outcome categories, not the full symptom narrative.

