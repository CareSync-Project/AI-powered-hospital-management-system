import { useEffect, useState } from 'react';
import { Activity, CalendarDays, CalendarPlus, ClipboardList, LogOut, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Stethoscope, Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clinicalWorkflowService } from '../services/clinicalWorkflowService';
import { vitalService } from '../services/vitalService';
import { triageService } from '../services/triageService';
import { notificationService } from '../services/notificationService';
import VitalEntryForm from '../components/nurse/VitalEntryForm';
import VitalSummary from '../components/nurse/VitalSummary';
import TriageForm from '../components/nurse/TriageForm';
import UrgencyBadge from '../components/nurse/UrgencyBadge';
import ClinicalAssessmentSummary from '../components/symptoms/ClinicalAssessmentSummary';
import NurseCareAssistant from '../components/nurse/NurseCareAssistant';
import NurseBookingPanel from '../components/nurse/NurseBookingPanel';
import '../clinical.css';

export default function NurseDashboard() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [view, setView] = useState('TODAY');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activePage, setActivePage] = useState('patients');

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.list();
      const list = res.data?.data || res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (e) {
      console.error('Nurse notification load error:', e.message);
    }
  };

  const load = () => {
    setError('');
    (view === 'ASSIGNED' ? clinicalWorkflowService.nurseAssigned() : clinicalWorkflowService.nurseWorklist())
      .then(r => setItems(r.data))
      .catch(e => setError(e.message));
    loadNotifications();
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [view]);

  const open = async item => {
    setSelected(item);
    setError('');
    setMessage('');
    try {
      setVitals((await vitalService.appointment(item.id)).data);
    } catch (e) {
      setError(e.message);
    }
  };

  const action = async fn => {
    try {
      await fn();
      const refreshed = (await (view === 'ASSIGNED' ? clinicalWorkflowService.nurseAssigned() : clinicalWorkflowService.nurseWorklist())).data;
      setItems(refreshed);
      if (selected) setSelected(refreshed.find(x => x.id === selected.id) || null);
      setMessage('Patient workflow updated successfully.');
    } catch (e) {
      setError(e.message);
    }
  };

  const visible = items.filter(x => filter === 'ALL' || x.status === filter);
  const count = status => items.filter(x => x.status === status).length;
  const age = value => {
    if (!value) return 'Not provided';
    const birth = new Date(value), now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years -= 1;
    return `${years} years`;
  };
  const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : 'Not scheduled';

  return (
    <div className="clinical-app nurse-dashboard-shell">
      <aside className="nurse-sidebar">
        <div className="nurse-brand"><span><Stethoscope size={21}/></span><div>CareSync<small>NURSE PORTAL</small></div></div>
        <nav>
          <button className={activePage === 'patients' && view === 'TODAY' ? 'active' : ''} onClick={() => {setActivePage('patients');setView('TODAY')}}><CalendarDays size={18}/>Assigned Today{view === 'TODAY' && items.length > 0 && <b>{items.length}</b>}</button>
          <button className={activePage === 'patients' && view === 'ASSIGNED' ? 'active' : ''} onClick={() => {setActivePage('patients');setView('ASSIGNED')}}><ClipboardList size={18}/>My Assigned Patients{view === 'ASSIGNED' && items.length > 0 && <b>{items.length}</b>}</button>
          <button className={activePage === 'booking' ? 'active' : ''} onClick={() => setActivePage('booking')}><CalendarPlus size={18}/>Book Appointment</button>
          <button className={activePage === 'announcements' ? 'active' : ''} onClick={() => setActivePage('announcements')}><Bell size={18}/>Announcements{unreadCount > 0 && <b>{unreadCount}</b>}</button>
        </nav>
        <div className="nurse-sidebar-profile"><span>{(user?.name || 'N').charAt(0).toUpperCase()}</span><div><strong>{user?.name || 'Nurse'}</strong><small>{user?.email}</small></div></div>
        <button className="nurse-logout" onClick={logout}><LogOut size={17}/>Sign out</button>
      </aside>
      <header className="clinical-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <small>Hospital clinical workflow</small>
            <h1><Stethoscope /> {activePage === 'announcements' ? 'Announcements' : activePage === 'booking' ? 'Book Appointment' : 'Nurse/Triage Dashboard'}</h1>
          <p>{user?.name || 'Nurse'} · {user?.email}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Notification Bell Button */}
          <button
            onClick={() => setActivePage('announcements')}
            style={{
              position: 'relative', background: '#ffffff', border: '1px solid #cbd5e1',
              padding: '0.6rem', borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#004449'
            }}
            title="Announcements & Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#dc2626',
                color: '#ffffff', fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem',
                borderRadius: '999px', border: '2px solid #ffffff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button onClick={load}><RefreshCw />Refresh</button>
        </div>
      </header>

      <main className="clinical-layout">
        {activePage === 'patients' && <>
        <aside>
          <div className="clinical-metrics">
            <span>{view === 'TODAY' ? 'Assigned today' : 'All assigned'}<b>{items.length}</b></span>
            <span>Checked in<b>{count('CHECKED_IN')}</b></span>
            <span>Waiting<b>{count('WAITING')}</b></span>
            <span>Emergency/High<b>{items.filter(x => ['EMERGENCY','HIGH'].includes(x.triageRecords?.[0]?.urgencyLevel)).length}</b></span>
          </div>

          <div className="clinical-filters">
            {['ALL','CONFIRMED','CHECKED_IN','TRIAGED','WAITING'].map(x => (
              <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x.replace('_',' ')}</button>
            ))}
          </div>

          <div className="worklist">
            {visible.length === 0 && <p className="worklist-empty">No assigned patients match this view.</p>}
            {visible.map(x => (
              <button key={x.id} className={selected?.id === x.id ? 'selected' : ''} onClick={() => open(x)}>
                <div>
                  <strong>{x.patient.firstName} {x.patient.lastName}</strong>
                  <small>{x.appointmentNumber} · {x.department.name}</small>
                  <small>{formatDate(x.appointmentDate)} · {x.startTime || 'Time pending'}</small>
                  <small>Dr. {x.doctor.firstName} {x.doctor.lastName}</small>
                </div>
                <div>
                  <UrgencyBadge level={x.triageRecords?.[0]?.urgencyLevel}/>
                  <span>{x.status.replaceAll('_',' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="clinical-panel">
          {error && <p className="clinical-error">{error}</p>}
          {message && <p className="clinical-success">{message}</p>}
          {!selected ? (
            <div className="clinical-empty">
              <ClipboardList />
              <h2>Select a patient appointment</h2>
              <p>Open a record to check in, capture vitals, triage, or move the patient to the queue.</p>
            </div>
          ) : (
            <>
              <div className="patient-clinical-heading">
                <div>
                  <h2>{selected.patient.firstName} {selected.patient.lastName}</h2>
                  <p>{selected.appointmentNumber} · {selected.department.name}</p>
                  <p>Reason: {selected.reasonForVisit}</p>
                </div>
                <UrgencyBadge level={selected.triageRecords?.[0]?.urgencyLevel}/>
              </div>

              <div className="patient-details-grid">
                <div><span>Patient ID</span><strong>{selected.patient.hospitalRecords?.find(x => x.hospitalId === selected.hospitalId)?.hospitalPatientNumber || 'Not issued'}</strong></div>
                <div><span>Date of birth / age</span><strong>{formatDate(selected.patient.dateOfBirth)} · {age(selected.patient.dateOfBirth)}</strong></div>
                <div><span>Gender</span><strong>{selected.patient.gender?.replaceAll('_', ' ') || 'Not provided'}</strong></div>
                <div><Mail size={16}/><span>Email</span><strong>{selected.patient.user?.email || 'Not provided'}</strong></div>
                <div><Phone size={16}/><span>Phone</span><strong>{selected.patient.phone || 'Not provided'}</strong></div>
                <div><MapPin size={16}/><span>Address</span><strong>{[selected.patient.address, selected.patient.city, selected.patient.region].filter(Boolean).join(', ') || 'Not provided'}</strong></div>
                <div><ShieldCheck size={16}/><span>Emergency contact</span><strong>{selected.patient.emergencyContactName || 'Not provided'}{selected.patient.emergencyContactPhone ? ` · ${selected.patient.emergencyContactPhone}` : ''}</strong></div>
                <div><CalendarDays size={16}/><span>Assigned visit</span><strong>{formatDate(selected.appointmentDate)} · {selected.startTime || 'Time pending'}</strong></div>
              </div>

              <ClinicalAssessmentSummary assessment={selected.symptomAssessments?.[0]} audience="nurse" />

              {selected.status === 'CONFIRMED' && (
                <button onClick={() => action(() => clinicalWorkflowService.checkIn(selected.id))}>Check in patient</button>
              )}

              {['CHECKED_IN','TRIAGED','WAITING'].includes(selected.status) && (
                <>
                  <h3><Activity/> Vital records</h3>
                  <div className="vital-history">
                    {vitals.length === 0 ? <p>No vitals recorded for this appointment.</p> : vitals.map(vital => (
                      <div key={vital.id} className="vital-history-item">
                        <small>{new Date(vital.recordedAt).toLocaleString()}</small>
                        <VitalSummary vital={vital}/>
                      </div>
                    ))}
                  </div>
                  {selected.status === 'CHECKED_IN' && (
                    <VitalEntryForm onSubmit={async data => {
                      await vitalService.record(selected.id, data);
                      setVitals((await vitalService.appointment(selected.id)).data);
                      setMessage('Verified vitals recorded successfully.');
                    }}/>
                  )}
                </>
              )}

              {selected.status === 'CHECKED_IN' && (
                <>
                  <h3>Triage</h3>
                  <TriageForm onSubmit={data => action(() => triageService.save(selected.id, data))}/>
                </>
              )}

              {selected.status === 'TRIAGED' && (
                <button onClick={() => action(() => clinicalWorkflowService.moveToWaiting(selected.id))}>Move to waiting queue</button>
              )}

              {selected.status === 'WAITING' && (
                <p className="queue-ready">Patient is waiting for the assigned doctor.</p>
              )}
            </>
          )}
        </section>
        </>}
        {activePage === 'booking' && <section className="clinical-panel nurse-full-page"><NurseBookingPanel onBooked={load}/></section>}
        {activePage === 'announcements' && <section className="clinical-panel nurse-full-page nurse-announcements">
          <div className="panel-heading"><div><h2>Announcements & Notifications</h2><p>Hospital updates and workflow notifications for your account.</p></div>{unreadCount>0&&<button onClick={async()=>{await notificationService.markAllRead();await loadNotifications()}}>Mark all as read</button>}</div>
          {notifications.length===0?<div className="clinical-empty"><Bell/><h3>No announcements</h3><p>You have no notifications at this time.</p></div>:<div className="nurse-notification-list">{notifications.map(notif=><article key={notif.id} className={notif.read?'':'unread'}><div><h3>{notif.title}</h3><p>{notif.message}</p><small>{new Date(notif.createdAt).toLocaleString()}</small></div>{!notif.read&&<button onClick={async()=>{await notificationService.markRead(notif.id);await loadNotifications()}}>Mark read</button>}</article>)}</div>}
        </section>}
      </main>

      {/* Notifications Modal for Nurse */}
      {showNotifModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '16px',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
            padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell color="#004449" size={22} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#004449', margin: 0 }}>Announcements & Notifications</h3>
              </div>
              <button onClick={() => setShowNotifModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {unreadCount > 0 && (
              <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <button
                  onClick={async () => {
                    await notificationService.markAllRead();
                    await loadNotifications();
                  }}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', cursor: 'pointer', color: '#004449', fontWeight: '700' }}
                >
                  Mark All as Read
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                No notifications or announcements.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '1rem', borderRadius: '10px',
                      border: notif.read ? '1px solid #e2e8f0' : '1.5px solid #007A83',
                      backgroundColor: notif.read ? '#f8fafc' : '#f0fdfa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{notif.title}</strong>
                      {!notif.read && (
                        <button
                          onClick={async () => {
                            await notificationService.markRead(notif.id);
                            await loadNotifications();
                          }}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#004449' }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.35rem 0 0.5rem 0' }}>{notif.message}</p>
                    <small style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(notif.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <NurseCareAssistant />
    </div>
  );
}
