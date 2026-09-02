# CareSync Administrative Analytics

CareSync analytics are calculated from PostgreSQL, never simulated counters. `GET /api/admin/analytics` returns total patients, unique patients today/week/month, appointment volumes for those periods, status totals, active doctor/nurse counts, department activity, and doctor/nurse workload. Patient counts and appointment counts are deliberately separate. Access is restricted to `ADMIN`.
