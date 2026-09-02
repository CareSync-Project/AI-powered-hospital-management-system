import api from './api';export const triageService={save:(id,data)=>api.post(`/clinical/appointments/${id}/triage`,data)};
