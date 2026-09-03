import api from './api';
export const clinicalWorkflowService={
 nurseWorklist:()=>api.get('/clinical/nurse/appointments/today'),nurseAssigned:()=>api.get('/clinical/nurse/assigned-patients'),nurseQueue:()=>api.get('/clinical/nurse/queue'),
 nurseBookingContext:()=>api.get('/clinical/nurse/booking/context'),nurseBookingDoctors:(patientId,departmentId,date)=>api.get(`/clinical/nurse/booking/doctors?patientId=${patientId}&departmentId=${departmentId}&date=${date}`),nurseBookAppointment:data=>api.post('/clinical/nurse/appointments',data),
 checkIn:id=>api.patch(`/clinical/appointments/${id}/check-in`,{}),moveToWaiting:id=>api.patch(`/clinical/appointments/${id}/waiting`,{}),doctorQueue:()=>api.get('/clinical/doctors/me/queue'),progress:id=>api.get(`/patient/appointments/${id}/progress`),
};
