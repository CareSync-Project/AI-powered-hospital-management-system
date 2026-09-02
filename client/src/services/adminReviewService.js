import api from './api';
const query=(values={})=>{const params=new URLSearchParams(Object.entries(values).filter(([,value])=>value));return params.toString()?`?${params}`:''};
export const adminReviewService={
 nurses:()=>api.get('/admin/nurses'), analytics:()=>api.get('/admin/analytics'), appointments:(filters)=>api.get(`/admin/appointments${query(filters)}`), reports:(filters)=>api.get(`/admin/reports${query(filters)}`),
 assignNurseDepartment:(nurseId,departmentId,active=true)=>api.patch(`/admin/nurses/${nurseId}/departments`,{departmentId,active}),
 assignNurseAppointment:(appointmentId,nurseId,active=true)=>api.patch(`/admin/appointments/${appointmentId}/nurse`,{nurseId,active}),
 bulkImport:(rows)=>api.post('/admin/staff/bulk-import',{rows}),
};
