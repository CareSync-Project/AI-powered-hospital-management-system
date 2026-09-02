# Symptom Knowledge Base

## Design

The Phase 7 knowledge base is a small, version-controlled JavaScript ruleset. Each entry has a display label, common symptoms, supporting symptoms, a short explanation, and a department category. Matching is deterministic: common matches receive more rule weight than supporting matches, ties are alphabetic, and no more than five results are returned.

The output uses qualitative labels (`HIGHER_MATCH`, `MODERATE_MATCH`, and `LOWER_MATCH`). These are rule-match strengths, not probabilities or medical confidence scores.

## Illustrative coverage

- Febrile illness patterns
- Common viral respiratory patterns
- Ear, nose, and throat concerns
- Gastrointestinal concerns
- Urinary concerns
- Headache patterns
- Respiratory concerns
- Skin concerns
- Dental concerns
- Eye concerns
- Pregnancy-related concerns
- Musculoskeletal concerns

Department categories include Emergency, General OPD, ENT, maternity/obstetrics, eye clinic, dental, dermatology, orthopedics, and pediatrics aliases. Resolution is limited to active departments in the patient-selected hospital. If a specialized department is unavailable, the engine uses an active General OPD when present; otherwise it returns no resolved department rather than inventing one.

## Governance and limitations

The rules are illustrative academic decision support and have not been clinically validated. No dataset was used to train a model, and no accuracy, precision, recall, sensitivity, or specificity has been measured. Any future change should be versioned, reviewed with qualified clinical input, tested for unintended routing, and documented with its evidence source. A future ML model must not silently replace this engine.

