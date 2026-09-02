# Phase 4 Scheduling Engine

```text
Hospital -> Department -> DepartmentSchedule -> DoctorDepartment
         -> DoctorSchedule -> ScheduleException -> AppointmentSlot
         -> Future Patient Booking (Phase 5)
```

## Rules

- Times use PostgreSQL `TIME(0)` and API `HH:mm`; dates use `YYYY-MM-DD` and PostgreSQL `DATE`.
- The current hospital timezone assumption is `Africa/Accra` (UTC year-round). A future hospital timezone field should replace this deployment assumption for multi-timezone operation.
- Clinic and doctor start times must be earlier than end times. Capacity, duration and maximum patients must be positive.
- Active department sessions on the same day cannot overlap. Multiple deliberate non-overlapping sessions are supported.
- Doctor schedules must be contained by an active department session, require an assignment, and cannot overlap the doctor's other schedules.

## Deterministic slot generation

Generation starts at the earliest schedule time and repeatedly adds `consultationDurationMinutes`. Ordinary capacity is one. It stops at the schedule end or `maximumPatients`, whichever comes first. Database uniqueness and `createMany(skipDuplicates)` prevent duplicate slots.

`LEAVE`, `HOLIDAY`, and full-day `UNAVAILABLE` generate no slots. Timed `UNAVAILABLE` removes intersecting slots. `CUSTOM_HOURS` intersects custom hours with normal working hours. If an exception conflicts with booked slots, the response reports booked conflicts; appointments are never silently cancelled.

Regeneration closes only obsolete future unbooked slots. Booked slots and their appointments are preserved. Existing matching slots remain intact. Slot discovery returns only `AVAILABLE` records whose `bookedCount < capacity`; booking transactions continue to mark capacity-full slots `FULL`. Manual/exception blocks use `BLOCKED`, and obsolete regenerated slots use `CLOSED`.
