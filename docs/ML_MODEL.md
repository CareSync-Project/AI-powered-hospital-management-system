# Phase 7.1 Symptom Machine-Learning Model

## Dataset and licence

- Dataset: **SympScan - Symptoms to Disease**, file `Diseases_and_Symptoms_dataset.csv`
- Source: https://www.kaggle.com/datasets/behzadhassan/sympscan-symptomps-to-disease
- Published licence: **CC0: Public Domain**
- Original shape inspected locally: 96,088 rows, one target, and 230 binary symptom columns covering 100 source labels
- Source description: “medically inspired”; it is not treated as clinical patient evidence

The dataset is not Ghana-specific and model performance should not be interpreted as Ghanaian clinical validation. No hospital application patient data was used.

## Scope and label mapping

Only source labels supporting a manageable outpatient prototype were selected. Nineteen thousand and ninety-two source rows mapped into seven safer categories:

- Viral respiratory illness
- ENT concern
- Gastrointestinal illness
- Urinary tract concern
- Allergy-related condition
- Asthma-like respiratory concern
- Eye-related condition

Raw mappings are versioned in `ai-service/training/feature_engineering.py`. Labels were grouped for patient-safe preliminary presentation, not to inflate scores. Pregnancy and emergencies remain rule-based.

## Features and preprocessing

Twenty-three binary features are created reproducibly: fever, headache, cough, runny nose, body aches, weakness, vomiting, diarrhoea, abdominal pain, difficulty breathing, chest pain, dizziness, rash, itching, sore throat, ear pain, eye pain, toothache, back pain, joint pain, painful urination, nausea, and allergic reaction.

Related source columns are combined by logical maximum. Missing feature columns fail training; used projected values contained zero missing cells. Identical projected feature/target patterns were removed before splitting to prevent duplicate leakage. This removed 17,778 projected duplicates and left 1,314 rows.

Final class distribution:

| Class | Rows |
|---|---:|
| allergy_related_condition | 139 |
| asthma_like_respiratory_concern | 138 |
| ent_concern | 576 |
| eye_related_condition | 32 |
| gastrointestinal_illness | 64 |
| urinary_tract_concern | 63 |
| viral_respiratory_illness | 302 |

Class imbalance was handled through stratification and balanced class/sample weights. No oversampling was used.

## Split and candidate evaluation

Random seed: `42`. Stratified split: 70% train (919), 15% validation (197), and 15% untouched test (198). Candidate selection used validation macro F1, with weighted F1 as tie-breaker.

| Candidate | Validation accuracy | Validation macro F1 | Validation weighted F1 |
|---|---:|---:|---:|
| Logistic Regression | 0.720812 | 0.727733 | 0.731753 |
| Random Forest | 0.598985 | 0.580132 | 0.608352 |
| Gradient Boosting | 0.659898 | 0.622507 | 0.671138 |

Logistic Regression was selected because it achieved the highest validation macro and weighted F1 while remaining small, transparent, and fast on CPU.

## Actual untouched-test results

- Accuracy: **0.696970**
- Macro precision: **0.663087**
- Macro recall: **0.777406**
- Macro F1: **0.676433**
- Weighted precision: **0.783052**
- Weighted recall: **0.696970**
- Weighted F1: **0.707478**

Confusion matrix row order follows the seven alphabetically encoded classes above and is stored, with the complete class report, in `ai-service/models/metrics.json`. Eye-related condition had only five test examples, so its reported metrics are especially unstable.

## Artifacts and inference

- Model: `ai-service/models/symptom_model.joblib`
- Metadata: `ai-service/models/metadata.json`
- Metrics and confusion matrix: `ai-service/models/metrics.json`
- Model version: `ml-logreg-v1.0`
- Low-confidence threshold: `0.45`

The FastAPI service loads the artifact once. Raw scores are only an internal ranking signal. Patient responses convert them to qualitative match strengths and never state disease probability or confirmed diagnosis. Temperature at or above 38°C sets the fever feature; no other missing vital is fabricated.

## Limitations

This is an academic prototype trained on a public, non-Ghanaian, medically inspired dataset. It is not prospectively validated, medically certified, calibrated for clinical probability, or appropriate for autonomous diagnosis. Several classes are small, the source provenance is not equivalent to reviewed clinical records, and absent symptom fields are interpreted as not reported. Emergency rules always precede inference, and model failure activates the Phase 7 rule engine.

