# Patient Card Workflow

Patients submit `HOSPITAL_CARD` or `NHIS_CARD` records for a hospital. The server derives ownership, forces `PENDING`, masks returned numbers, creates a notification, and audits submission without the card number.

| Status | Patient experience | Booking use |
|---|---|---|
| `PENDING` | Pending hospital verification | Disabled |
| `VERIFIED` | Verified manually by that hospital | Eligible for that hospital |
| `REJECTED` | Rejection state and safe reason | Disabled |

An administrator can verify only cards for their authenticated hospital. Verification transactionally maintains the unique patient/hospital relationship and creates a patient notification; rejection also notifies. A patient cannot self-verify.

This project does **not** integrate with an official NHIA/NHIS verification API. “Verified” means manual hospital verification in this academic prototype.
