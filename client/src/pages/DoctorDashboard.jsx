import { useEffect, useState } from 'react';
import { Activity, CalendarDays, LogOut, RefreshCw, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clinicalWorkflowService } from '../services/clinicalWorkflowService';
import { consultationService } from '../services/consultationService';
import { doctorService } from '../services/doctorService';
import VitalSummary from '../components/nurse/VitalSummary';
import UrgencyBadge from '../components/nurse/UrgencyBadge';
import ClinicalAssessmentSummary from '../components/symptoms/ClinicalAssessmentSummary';
import '../clinical.css';

const blank = { chiefComplaint: '', clinicalObservations: '', consultationNotes: '', diagnosis: '', treatmentPlan: '', followUpRequired: false, followUpDate: '' };
export default function DoctorDashboard() {
  const { profile, logout } = useAuth();
  const [queue, setQueue] = useState([]), [selected, setSelected] = useState(null), [form, setForm] = useState(blank), [tab, setTab] = useState('queue'), [schedule, setSchedule] = useState({ schedules: [], exceptions: [] }), [error, setError] = useState('');
  const load = () => clinicalWorkflowService.doctorQueue().then(r => setQueue(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); doctorService.mySchedule().then(r => setSchedule(r.data)).catch(e => setError(e.message)); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
  const open = async item => { try { const context = (await consultationService.context(item.id)).data; setSelected(context); setForm(context.consultation ? { ...blank, ...context.consultation, followUpDate: context.consultation.followUpDate?.slice(0, 10) || '' } : { ...blank, chiefComplaint: context.triageRecords?.[0]?.chiefComplaint || context.reasonForVisit }); } catch (e) { setError(e.message); } };
  const start = async () => { try { await consultationService.start(selected.id); await open(selected); await load(); } catch (e) { setError(e.message); } };
  const payload = () => ({ ...form, followUpDate: form.followUpDate || null });
  const save = async () => { try { await consultationService.save(selected.id, payload()); setError('Draft saved successfully.'); } catch (e) { setError(e.message); } };
  const complete = async () => { if (!confirm('Complete this consultation? The appointment will be marked completed.')) return; try { await consultationService.complete(selected.id, payload()); setSelected(null); setForm(blank); await load(); } catch (e) { setError(e.message); } };
  return <div className="clinical-app">
    <header className="clinical-header"><div><small>PostgreSQL-backed clinical portal</small><h1><Stethoscope /> Doctor Dashboard</h1><p>Dr. {profile?.firstName} {profile?.lastName}</p></div><div><button onClick={load}><RefreshCw />Refresh</button><button onClick={logout}><LogOut />Logout</button></div></header>
    <div className="clinical-filters" style={{ maxWidth: 1400, margin: '1rem auto' }}><button className={tab === 'queue' ? 'active' : ''} onClick={() => setTab('queue')}>My Queue</button><button className={tab === 'schedule' ? 'active' : ''} onClick={() => setTab('schedule')}>My Schedule</button></div>
    {tab === 'schedule' ? <main className="clinical-panel" style={{ maxWidth: 1400, margin: 'auto' }}><h2><CalendarDays /> My schedule</h2>{schedule.schedules.map(item => <article className="queue-ready" key={item.id}><strong>{item.dayOfWeek}</strong> · {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}–{new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} · {item.department?.name}</article>)}{!schedule.schedules.length && <p>No schedule configured.</p>}</main> : <main className="clinical-layout">
      <aside><div className="clinical-metrics"><span>Waiting<b>{queue.filter(x => x.status === 'WAITING').length}</b></span><span>In consultation<b>{queue.filter(x => x.status === 'IN_CONSULTATION').length}</b></span></div><div className="worklist">{queue.map(item => <button key={item.id} onClick={() => open(item)} className={selected?.id === item.id ? 'selected' : ''}><div><strong>{item.patient.firstName} {item.patient.lastName}</strong><small>{item.appointmentNumber} · {item.department.name}</small><small>{item.status.replaceAll('_', ' ')}</small></div><UrgencyBadge level={item.triageRecords?.[0]?.urgencyLevel} /></button>)}</div></aside>
      <section className="clinical-panel">{error && <p className={error.includes('success') ? 'queue-ready' : 'clinical-error'}>{error}</p>}{!selected ? <div className="clinical-empty"><Activity /><h2>Select an assigned patient</h2><p>Only your waiting and active consultations appear here.</p></div> : <><div className="patient-clinical-heading"><div><h2>{selected.patient.firstName} {selected.patient.lastName}</h2><p>{selected.appointmentNumber} · {selected.department.name}</p><p>Reason: {selected.reasonForVisit}</p></div><UrgencyBadge level={selected.triageRecords?.[0]?.urgencyLevel} /></div><ClinicalAssessmentSummary assessment={selected.symptomAssessments?.[0]} /><h3>Triage and latest verified vitals</h3><p>{selected.triageRecords?.[0]?.chiefComplaint || 'No triage summary'}</p><VitalSummary vital={selected.vitalRecords?.find(x => x.verificationStatus === 'VERIFIED')} />{selected.status === 'WAITING' ? <button onClick={start}>Start consultation</button> : <ConsultationForm form={form} setForm={setForm} save={save} complete={complete} />}</>}</section>
    </main>}
  </div>;
}

function ConsultationForm({ form, setForm, save, complete }) {
  const fields = [['chiefComplaint', 'Chief complaint'], ['clinicalObservations', 'Clinical observations'], ['consultationNotes', 'Consultation notes'], ['diagnosis', 'Clinician-entered diagnosis'], ['treatmentPlan', 'Treatment plan']];
  return <form className="clinical-form consultation-grid" onSubmit={e => e.preventDefault()}>{fields.map(([key, label]) => <label className={['consultationNotes', 'treatmentPlan'].includes(key) ? 'wide' : ''} key={key}>{label}<textarea required={['chiefComplaint', 'diagnosis', 'treatmentPlan'].includes(key)} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}<label><input type="checkbox" checked={form.followUpRequired} onChange={e => setForm({ ...form, followUpRequired: e.target.checked })} /> Follow-up recommended</label>{form.followUpRequired && <label>Follow-up date<input type="date" required value={form.followUpDate || ''} onChange={e => setForm({ ...form, followUpDate: e.target.value })} /></label>}<div className="wide"><button type="button" onClick={save}>Save draft</button> <button type="button" onClick={complete}>Complete consultation</button></div></form>;
}
