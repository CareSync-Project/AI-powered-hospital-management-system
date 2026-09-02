import { useEffect, useState } from 'react';
import { Activity, ClipboardList, LogOut, RefreshCw, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clinicalWorkflowService } from '../services/clinicalWorkflowService';
import { vitalService } from '../services/vitalService';
import { triageService } from '../services/triageService';
import VitalEntryForm from '../components/nurse/VitalEntryForm';
import VitalSummary from '../components/nurse/VitalSummary';
import TriageForm from '../components/nurse/TriageForm';
import UrgencyBadge from '../components/nurse/UrgencyBadge';
import ClinicalAssessmentSummary from '../components/symptoms/ClinicalAssessmentSummary';
import '../clinical.css';

export default function NurseDashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]); const [selected, setSelected] = useState(null);
  const [vitals, setVitals] = useState([]); const [filter, setFilter] = useState('ALL'); const [view, setView] = useState('TODAY'); const [error, setError] = useState('');
  const load = () => (view === 'ASSIGNED' ? clinicalWorkflowService.nurseAssigned() : clinicalWorkflowService.nurseWorklist()).then(r => setItems(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [view]);
  const open = async item => { setSelected(item); try { setVitals((await vitalService.appointment(item.id)).data); } catch (e) { setError(e.message); } };
  const action = async fn => { try { await fn(); const refreshed = (await clinicalWorkflowService.nurseWorklist()).data; setItems(refreshed); if (selected) setSelected(refreshed.find(x => x.id === selected.id) || null); } catch (e) { setError(e.message); } };
  const visible = items.filter(x => filter === 'ALL' || x.status === filter); const count = status => items.filter(x => x.status === status).length;
  return <div className="clinical-app">
    <header className="clinical-header"><div><small>Hospital clinical workflow</small><h1><Stethoscope/> Nurse/Triage Dashboard</h1><p>{user?.email}</p></div><div><button onClick={load}><RefreshCw/>Refresh</button><button onClick={logout}><LogOut/>Logout</button></div></header>
    <main className="clinical-layout"><aside>
      <div className="clinical-metrics"><span>Today<b>{items.length}</b></span><span>Checked in<b>{count('CHECKED_IN')}</b></span><span>Waiting<b>{count('WAITING')}</b></span><span>Emergency/High<b>{items.filter(x => ['EMERGENCY','HIGH'].includes(x.triageRecords?.[0]?.urgencyLevel)).length}</b></span></div>
      <div className="clinical-filters"><button className={view==='TODAY'?'active':''} onClick={()=>setView('TODAY')}>Today's Patients</button><button className={view==='ASSIGNED'?'active':''} onClick={()=>setView('ASSIGNED')}>My Assigned Patients</button>{['ALL','CONFIRMED','CHECKED_IN','TRIAGED','WAITING'].map(x => <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x.replace('_',' ')}</button>)}</div>
      <div className="worklist">{visible.map(x => <button key={x.id} className={selected?.id === x.id ? 'selected' : ''} onClick={() => open(x)}><div><strong>{x.patient.firstName} {x.patient.lastName}</strong><small>{x.appointmentNumber} · {x.department.name}</small><small>Dr. {x.doctor.firstName} {x.doctor.lastName}</small></div><div><UrgencyBadge level={x.triageRecords?.[0]?.urgencyLevel}/><span>{x.status.replaceAll('_',' ')}</span></div></button>)}</div>
    </aside><section className="clinical-panel">
      {error && <p className="clinical-error">{error}</p>}
      {!selected ? <div className="clinical-empty"><ClipboardList/><h2>Select a patient appointment</h2><p>Open a record to check in, capture vitals, triage, or move the patient to the queue.</p></div> : <>
        <div className="patient-clinical-heading"><div><h2>{selected.patient.firstName} {selected.patient.lastName}</h2><p>{selected.appointmentNumber} · {selected.department.name}</p><p>Reason: {selected.reasonForVisit}</p></div><UrgencyBadge level={selected.triageRecords?.[0]?.urgencyLevel}/></div>
        <ClinicalAssessmentSummary assessment={selected.symptomAssessments?.[0]} audience="nurse" />
        {selected.status === 'CONFIRMED' && <button onClick={() => action(() => clinicalWorkflowService.checkIn(selected.id))}>Check in patient</button>}
        {['CHECKED_IN','TRIAGED','WAITING'].includes(selected.status) && <><h3><Activity/> Vital records</h3><VitalSummary vital={vitals[0]}/>{vitals[0]?.source === 'PATIENT' && vitals[0]?.verificationStatus === 'UNVERIFIED' && <button onClick={async () => { await vitalService.verify(vitals[0].id); setVitals((await vitalService.appointment(selected.id)).data); }}>Verify reviewed patient entry</button>}{selected.status === 'CHECKED_IN' && <VitalEntryForm onSubmit={async data => { await vitalService.record(selected.id, data); setVitals((await vitalService.appointment(selected.id)).data); }}/>}</>}
        {selected.status === 'CHECKED_IN' && <><h3>Triage</h3><TriageForm onSubmit={data => action(() => triageService.save(selected.id, data))}/></>}
        {selected.status === 'TRIAGED' && <button onClick={() => action(() => clinicalWorkflowService.moveToWaiting(selected.id))}>Move to waiting queue</button>}
        {selected.status === 'WAITING' && <p className="queue-ready">Patient is waiting for the assigned doctor.</p>}
      </>}
    </section></main>
  </div>;
}
