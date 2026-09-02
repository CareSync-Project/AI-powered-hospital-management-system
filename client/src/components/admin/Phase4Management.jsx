import { useEffect, useState } from 'react';
import { hospitalService } from '../../services/hospitalService';
import { departmentService } from '../../services/departmentService';
import { doctorService } from '../../services/doctorService';
import { scheduleService } from '../../services/scheduleService';

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const Panel = ({ children }) => <div className="glass-panel" style={{ padding: '2rem' }}>{children}</div>;
const Feedback = ({ value }) => value ? <p style={{ color: value.error ? 'var(--color-error)' : 'var(--color-success)' }}>{value.message}</p> : null;

export default function Phase4Management({ section }) {
  const [hospital, setHospital] = useState(null); const [departments, setDepartments] = useState([]); const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true); const [feedback, setFeedback] = useState(null);
  const [department, setDepartment] = useState({ name:'', code:'', description:'', requiresAppointment:true });
  const [doctor, setDoctor] = useState({ firstName:'', lastName:'', email:'', password:'', phone:'', employeeNumber:'', licenseNumber:'', specialization:'', qualification:'', startedAt:new Date().toISOString().slice(0,10), departmentId:'', primaryDepartment:true });
  const [schedule, setSchedule] = useState({ doctorId:'', departmentId:'', dayOfWeek:'MONDAY', startTime:'08:00', endTime:'16:00', consultationDurationMinutes:20, maximumPatients:20 });
  const load = async () => { setLoading(true); try { const [h,d,docs]=await Promise.all([hospitalService.getManaged(),departmentService.listManaged(),doctorService.listManaged()]); setHospital(h.data); setDepartments(d.data); setDoctors(docs.data); } catch(e){setFeedback({error:true,message:e.message});} finally{setLoading(false);} };
  useEffect(()=>{load();},[]);
  const run = async (work, message) => { try { await work(); setFeedback({message}); await load(); } catch(e){setFeedback({error:true,message:e.message});} };
  if (loading) return <Panel>Loading hospital management data…</Panel>;

  if (section === 'hospital') return <Panel><h3>Hospital Settings</h3><Feedback value={feedback}/>{hospital && <form onSubmit={e=>{e.preventDefault();run(()=>hospitalService.updateManaged(hospital),'Hospital updated.')}} className="management-form-grid">{['name','hospitalCode','address','city','region','country','phone','email'].map(key=><label key={key}>{key.replace(/([A-Z])/g,' $1')}<input className="input-field" value={hospital[key]||''} onChange={e=>setHospital({...hospital,[key]:e.target.value})}/></label>)}<button className="btn btn-primary">Save hospital</button></form>}</Panel>;

  if (section === 'departments')
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#ffffff', color: '#004449' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#004449' }}>Create Hospital Department</h3>
          <Feedback value={feedback} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!department.name || !department.code) {
                setFeedback({ error: true, message: 'Department name and code are required.' });
                return;
              }
              run(() => departmentService.create(department), 'Department created successfully.');
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}
          >
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.25rem' }}>Department Name</label>
              <input
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                placeholder="e.g. Cardiology"
                value={department.name}
                onChange={(e) => setDepartment({ ...department, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.25rem' }}>Department Code</label>
              <input
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                placeholder="e.g. CARD"
                value={department.code}
                onChange={(e) => setDepartment({ ...department, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.25rem' }}>Description</label>
              <input
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                placeholder="Brief description of clinical services provided..."
                value={department.description}
                onChange={(e) => setDepartment({ ...department, description: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" style={{ backgroundColor: '#004449', color: '#ffffff', padding: '0.65rem 1.5rem', fontWeight: '600' }}>
                Create Department
              </button>
            </div>
          </form>
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449', marginTop: '0.5rem' }}>Existing Hospital Departments</div>
        {departments.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#ffffff', color: '#64748b' }}>
            No departments configured in this hospital yet. Use the form above to add your first department.
          </div>
        ) : (
          departments.map((d) => (
            <div key={d.id} className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#004449' }}>
                    {d.name} <span style={{ fontSize: '0.85rem', color: '#007A83', backgroundColor: '#e6f4f5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{d.code}</span>
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {d.description || 'No description provided'} · <span style={{ color: d.active ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{d.active ? '● Active' : '○ Inactive'}</span> · {d.doctorDepartments?.length || 0} assigned doctors
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() =>
                    window.confirm(`${d.active ? 'Deactivate' : 'Activate'} ${d.name}?`) &&
                    run(() => departmentService.update(d.id, { active: !d.active }), `Department ${d.active ? 'deactivated' : 'activated'}.`)
                  }
                >
                  {d.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '600', color: '#005a60', marginBottom: '0.5rem' }}>Operating Schedule & Daily Capacity:</div>
                {d.schedules?.length ? (
                  d.schedules.map((s) => (
                    <div key={s.id} style={{ color: '#334155', marginBottom: '0.2rem' }}>
                      • <strong>{s.dayOfWeek}:</strong> {new Date(s.startTime).toISOString().slice(11, 16)} – {new Date(s.endTime).toISOString().slice(11, 16)} (Max Capacity: {s.dailyCapacity} patients)
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#94a3b8' }}>No clinic schedule configured for this department yet.</div>
                )}
              </div>

              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', backgroundColor: '#007A83', color: '#ffffff', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                onClick={() => {
                  const day = window.prompt('Day of Week (MONDAY-SUNDAY)', 'MONDAY');
                  const start = window.prompt('Start time (HH:MM)', '08:00');
                  const end = window.prompt('End time (HH:MM)', '16:00');
                  const capacity = Number(window.prompt('Daily capacity', '40'));
                  if (day && start && end)
                    run(
                      () => departmentService.createSchedule(d.id, { dayOfWeek: day.toUpperCase(), startTime: start, endTime: end, dailyCapacity: capacity }),
                      'Clinic schedule created.'
                    );
                }}
              >
                + Configure Operating Schedule
              </button>
            </div>
          ))
        )}
      </div>
    );

  if (section === 'doctors') return <div style={{display:'grid',gap:'1.5rem'}}><Panel><h3>Add Doctor</h3><Feedback value={feedback}/><form className="management-form-grid" onSubmit={e=>{e.preventDefault();const payload={...doctor,...(!doctor.departmentId?{departmentId:undefined}:{})};run(()=>doctorService.create(payload),'Doctor account created. Initial password should be changed at first login.')}}>{['firstName','lastName','email','password','phone','employeeNumber','licenseNumber','specialization','qualification'].map(k=><input key={k} type={k==='password'?'password':'text'} className="input-field" placeholder={k.replace(/([A-Z])/g,' $1')} value={doctor[k]} onChange={e=>setDoctor({...doctor,[k]:e.target.value})}/>)}<select className="input-field" value={doctor.departmentId} onChange={e=>setDoctor({...doctor,departmentId:e.target.value})}><option value="">No initial department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><button className="btn btn-primary">Create doctor</button></form></Panel>{doctors.length===0?<Panel>No doctors assigned.</Panel>:doctors.map(d=><Panel key={d.id}><h3>Dr. {d.firstName} {d.lastName}</h3><p>{d.specialization} · {d.active?'Active':'Inactive'}</p><p>Departments: {d.departments?.filter(x=>x.active).map(x=>`${x.department.name}${x.primaryDepartment?' (primary)':''}`).join(', ')||'None'}</p><p>Working days: {d.schedules?.filter(x=>x.active).map(x=>x.dayOfWeek).join(', ')||'No schedule'}</p><p>Upcoming exception: {d.scheduleExceptions?.[0] ? `${new Date(d.scheduleExceptions[0].date).toISOString().slice(0,10)} ${d.scheduleExceptions[0].exceptionType}` : 'None'}</p><div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}><button className="btn btn-outline" onClick={()=>window.confirm(`${d.active?'Deactivate':'Activate'} this doctor?`)&&run(()=>doctorService.update(d.id,{active:!d.active}),'Doctor updated.')}>{d.active?'Deactivate':'Activate'}</button><button className="btn btn-outline" onClick={()=>{const departmentId=window.prompt('Department UUID',departments[0]?.id||'');if(departmentId)run(()=>doctorService.assignDepartment(d.id,{departmentId,primaryDepartment:window.confirm('Make this the primary department?')}),'Department assigned.');}}>Assign department</button><button className="btn btn-outline" onClick={()=>{const date=window.prompt('Exception date (YYYY-MM-DD)');const exceptionType=window.prompt('LEAVE, UNAVAILABLE, CUSTOM_HOURS or HOLIDAY','LEAVE');const reason=window.prompt('Reason (optional)','');if(date&&exceptionType)run(()=>scheduleService.createException(d.id,{date,exceptionType:exceptionType.toUpperCase(),reason}),'Schedule exception created.');}}>Add leave/exception</button></div></Panel>)}</div>;

  return <div style={{display:'grid',gap:'1.5rem'}}><Panel><h3>Doctor Schedules and Slot Generation</h3><Feedback value={feedback}/><form className="management-form-grid" onSubmit={e=>{e.preventDefault();run(()=>scheduleService.createDoctor(schedule.doctorId,{...schedule,doctorId:undefined,consultationDurationMinutes:Number(schedule.consultationDurationMinutes),maximumPatients:Number(schedule.maximumPatients)}),'Doctor schedule created.')}}><select className="input-field" value={schedule.doctorId} onChange={e=>setSchedule({...schedule,doctorId:e.target.value})}><option value="">Select doctor</option>{doctors.map(d=><option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}</select><select className="input-field" value={schedule.departmentId} onChange={e=>setSchedule({...schedule,departmentId:e.target.value})}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="input-field" value={schedule.dayOfWeek} onChange={e=>setSchedule({...schedule,dayOfWeek:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select>{['startTime','endTime','consultationDurationMinutes','maximumPatients'].map(k=><input key={k} type={k.includes('Time')?'time':'number'} className="input-field" value={schedule[k]} onChange={e=>setSchedule({...schedule,[k]:e.target.value})}/>) }<button className="btn btn-primary">Add schedule</button></form></Panel><Panel><h3>Generate Appointment Slots</h3><button className="btn btn-primary" onClick={()=>{const date=window.prompt('Date (YYYY-MM-DD)',new Date().toISOString().slice(0,10));if(date&&schedule.doctorId&&schedule.departmentId)run(()=>scheduleService.generateSlots(schedule.doctorId,{departmentId:schedule.departmentId,date}),'Slots generated safely.');}}>Generate selected doctor slots</button><p style={{marginTop:'1rem'}}>Leave, unavailable and custom-hour exceptions are managed through the secured Phase 4 API and reflected during generation.</p></Panel></div>;
}
