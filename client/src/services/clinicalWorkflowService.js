import api from './api';
export const clinicalWorkflowService={
 nurseWorklist:()=>api.get('/clinical/nurse/appointments/today'),nurseAssigned:()=>api.get('/clinical/nurse/assigned-patients'),nurseQueue:()=>api.get('/clinical/nurse/queue'),
 checkIn:id=>api.patch(`/clinical/appointments/${id}/check-in`,{}),moveToWaiting:id=>api.patch(`/clinical/appointments/${id}/waiting`,{}),doctorQueue:()=>api.get('/clinical/doctors/me/queue'),progress:id=>api.get(`/patient/appointments/${id}/progress`),
};
