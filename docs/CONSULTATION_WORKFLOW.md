# Consultation Workflow

The assigned doctor sees only their `WAITING` and `IN_CONSULTATION` appointments with patient summary, appointment reason, triage, and relevant vitals.

Starting conditionally transitions `WAITING → IN_CONSULTATION`, timestamps the appointment, initializes the unique Consultation, and audits the action in a serializable transaction. Conditional updates prevent simultaneous starts.

Draft save does not complete an appointment. Diagnosis and treatment are clinician-entered; patient text, vital indicators, symptom keywords, and future AI data are never copied into diagnosis automatically.

Completion requires diagnosis and treatment plan. Follow-up requires a future date. Completion atomically timestamps Consultation and Appointment, sets `COMPLETED`, audits, and notifies the patient. It does not auto-book follow-up.

Patients retrieve only their own finalized doctor/date/diagnosis/treatment/follow-up summary. Internal consultation notes and audits are excluded.
