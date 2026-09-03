# Vitals

Phase 6 records temperature (°C), blood pressure (mmHg), heart rate (bpm), oxygen saturation (%), respiratory rate (breaths/min), weight (kg), height (cm), BMI, and blood glucose in **mmol/L**. Measurements remain nullable.

Patients have read-only access to their vital-sign history. Only the nurse actively assigned to an appointment can record readings; nurse readings are stored as `NURSE` and immediately `VERIFIED`. The backend derives source, verification, actor, patient, hospital, and appointment.

BMI is calculated server-side as `weightKg / heightMetres²`. Broad technical bounds reject impossible data but do not define health. Conservative adult display indicators are `WITHIN_EXPECTED_RANGE`, `LOW`, `HIGH`, and `URGENT_REVIEW`. They never produce a diagnosis. Thresholds vary with age, pregnancy, chronic disease, context, and measurement method. **These indicators do not replace clinical assessment.**

Clinical submissions require network access. Sensitive vital responses remain network-only under the PWA policy.
