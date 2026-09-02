# CareSync Staff Management

`ADMIN` is the highest administrative role. Public registration creates patients only. Admin creates doctors and nurses, assigns staff to configurable departments, manages schedules, and assigns nurses to visits. Admin cannot create another admin through staff endpoints.

`NurseDepartment` supports multiple active department assignments with duplicate prevention. `NurseAppointmentAssignment` connects a nurse to a visit rather than permanently assigning a patient. No email is claimed or sent because no provider is configured.
