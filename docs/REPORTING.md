# CareSync Reporting

Administrative monitoring uses PostgreSQL appointments and supports date, department, doctor, nurse, and status filters. CSV export is generated in the browser from the authorized result. Admin cannot edit clinical diagnosis through reports.

Doctor reporting is ownership-scoped and provides daily appointments, status counts, completed consultations, follow-ups, and department breakdown. A dedicated doctor availability approval-request model remains future work; doctors cannot silently modify schedules or cancel booked visits.
