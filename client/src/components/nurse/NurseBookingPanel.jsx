import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { clinicalWorkflowService } from '../../services/clinicalWorkflowService';

const time = value => value ? new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) : '';

export default function NurseBookingPanel({onBooked}) {
  const [context,setContext]=useState({patients:[],departments:[]});
  const [doctors,setDoctors]=useState([]);
  const [form,setForm]=useState({patientId:'',departmentId:'',date:'',slotId:'',reasonForVisit:'',symptomsSummary:''});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const today=new Date().toISOString().slice(0,10),maxDate=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
  useEffect(()=>{clinicalWorkflowService.nurseBookingContext().then(r=>setContext(r.data)).catch(e=>setError(e.message))},[]);
  useEffect(()=>{setDoctors([]);setForm(old=>({...old,slotId:''}));if(form.patientId&&form.departmentId&&form.date)clinicalWorkflowService.nurseBookingDoctors(form.patientId,form.departmentId,form.date).then(r=>setDoctors(r.data)).catch(e=>setError(e.message))},[form.patientId,form.departmentId,form.date]);
  const slots=useMemo(()=>doctors.flatMap(doctor=>doctor.appointmentSlots.map(slot=>({...slot,doctor}))),[doctors]);
  const selected=slots.find(slot=>slot.id===form.slotId);
  const submit=async event=>{event.preventDefault();setBusy(true);setError('');setSuccess('');try{const result=(await clinicalWorkflowService.nurseBookAppointment({patientId:form.patientId,slotId:form.slotId,reasonForVisit:form.reasonForVisit,symptomsSummary:form.symptomsSummary||null})).data;setSuccess(`Appointment ${result.appointmentNumber} booked successfully.`);setForm(old=>({...old,slotId:'',reasonForVisit:'',symptomsSummary:''}));onBooked?.()}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <section className="nurse-booking-panel">
    <div className="nurse-page-intro"><span><CalendarPlus/></span><div><h2>Book for an assigned patient</h2><p>Select a patient already assigned to you and reserve a real available slot.</p></div></div>
    {error&&<p className="clinical-error">{error}</p>}{success&&<p className="clinical-success"><CheckCircle2 size={18}/>{success}</p>}
    {context.patients.length===0?<div className="clinical-empty"><h3>No assigned patients</h3><p>An administrator must assign a patient appointment to you before you can make another booking for that patient.</p></div>:
    <form className="nurse-booking-form" onSubmit={submit}>
      <label>Patient<select required value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}><option value="">Select patient</option>{context.patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {p.phone}</option>)}</select></label>
      <label>Department<select required value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}><option value="">Select department</option>{context.departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Appointment date<input required type="date" min={today} max={maxDate} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <div className="nurse-slot-grid">{slots.map(slot=><button type="button" key={slot.id} className={form.slotId===slot.id?'selected':''} onClick={()=>setForm({...form,slotId:slot.id})}><strong>Dr. {slot.doctor.firstName} {slot.doctor.lastName}</strong><span>{time(slot.startTime)}–{time(slot.endTime)}</span><small>{slot.doctor.specialization}</small></button>)}</div>
      {form.patientId&&form.departmentId&&form.date&&slots.length===0&&<p className="patient-help">No available slots on this date.</p>}
      <label>Reason for visit<textarea required minLength="3" maxLength="1000" value={form.reasonForVisit} onChange={e=>setForm({...form,reasonForVisit:e.target.value})}/></label>
      <label>Symptoms or additional notes<textarea maxLength="2000" value={form.symptomsSummary} onChange={e=>setForm({...form,symptomsSummary:e.target.value})}/></label>
      {selected&&<div className="booking-summary"><strong>Selected:</strong> Dr. {selected.doctor.firstName} {selected.doctor.lastName}, {form.date} at {time(selected.startTime)}</div>}
      <button disabled={busy||!form.slotId}>{busy?'Booking…':'Confirm appointment booking'}</button>
    </form>}
  </section>;
}
