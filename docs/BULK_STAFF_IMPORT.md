# Secure Bulk Staff Import

The admin page provides a CSV template because no XLSX dependency is installed. Columns are `firstName,lastName,email,phone,employeeNumber,role,department,specialization,qualification,licenseNumber,initialPassword`.

Only `DOCTOR` and `NURSE` are accepted by backend validation. `ADMIN`, `PATIENT`, `SUPER_ADMIN`, and unknown roles are rejected. Departments must be active in CareSync. Password rules apply and bcrypt hashes are stored; uploaded files and plaintext passwords are not retained by the server or localStorage. Results include total, successful, failed, and per-row errors.
