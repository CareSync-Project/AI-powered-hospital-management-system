# AI Safety and Clinical Boundaries

## Safety boundaries

- The Phase 7 engine is rule-based preliminary decision support, not diagnosis.
- It does not prescribe medication, treatment, dosage, or discharge.
- Red flags produce urgent-care guidance, not a disease label.
- Only a doctor can write the consultation diagnosis and treatment plan.
- Only authorised nursing staff determine clinical triage urgency.
- The assessment cannot overwrite nurse triage, verified vitals, consultation notes, or appointment workflow state.
- Patients can read only their own assessments; clinicians require an appointment-based care relationship.

## Transparency

Every result identifies the method as `RULE_BASED`, includes version `rule-v1.0`, explains matched symptoms, identifies the recommended department, and displays a disclaimer. The interface does not use fabricated probabilities or performance metrics.

## Known limitations

Keyword and phrase rules cannot capture the full clinical context, language variation, age-specific presentation, pregnancy complexity, chronic disease, drug effects, or measurement uncertainty. A missing red flag does not prove that a situation is safe. The selected hospital may not contain the ideal specialist department. Users are told to seek professional assessment and emergency help when concerned.

## Data protection

Symptom narratives are stored in PostgreSQL as sensitive patient data. They are not written to localStorage, embedded in JWTs, deliberately cached by the PWA, or copied into audit metadata. Production deployment must use HTTPS, a restrictive CORS allowlist, secure cookies, encrypted backups, retention rules, and appropriately restricted database and log access.

## Future model governance

Any Phase 8 or post-project ML work requires a documented intended use, dataset provenance and consent, bias and subgroup evaluation, clinical validation, versioning, monitoring, rollback, and human oversight. Model suggestions must remain visibly separate from clinician-entered diagnosis. No clinical performance claim may be made until it is actually measured with an appropriate protocol.

