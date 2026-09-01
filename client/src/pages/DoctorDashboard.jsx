import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, Clock, CheckCircle, Users, Activity, ShieldPlus, Play, Square, FileText } from 'lucide-react';
import { doctorService } from '../services/doctorService';

const DoctorDashboard = () => {
  const { user, profile, hospitalContext, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [queueLength, setQueueLength] = useState(0);

  const [activeConsultation, setActiveConsultation] = useState(null);
  const [consultationStartTime, setConsultationStartTime] = useState(null);
  const [scheduleData, setScheduleData] = useState({ schedules: [], exceptions: [] });
  const [scheduleError, setScheduleError] = useState('');

  // Load existing data
  useEffect(() => {
    loadAppointments();
    doctorService.mySchedule().then((response) => setScheduleData(response.data)).catch((error) => setScheduleError(error.message));
  }, [user.id]);

  const loadAppointments = () => {
    const loadedAppointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
    // Only show scheduled appointments for this doctor
    const myAppointments = loadedAppointments.filter(app => app.doctorId === user.id && app.status === 'scheduled');
    setAppointments(myAppointments);
    setQueueLength(myAppointments.length);
  };

  const handleStartConsultation = (appId) => {
    setActiveConsultation(appId);
    setConsultationStartTime(Date.now());
  };

  const handleCompleteAppointment = (appId) => {
    const notes = window.prompt("Enter consultation notes/prescription for this patient:");
    
    // Calculate duration in minutes (minimum 1 minute, or if they tested it really fast, let's just use the actual math)
    let durationMins = 0;
    if (activeConsultation === appId && consultationStartTime) {
      durationMins = Math.max(1, Math.round((Date.now() - consultationStartTime) / 60000));
    } else {
      // Fallback if they clicked complete without starting timer
      durationMins = 15; 
    }

    const loadedAppointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
    const updatedApps = loadedAppointments.map(app => {
      if (app.id === appId) {
        return { 
          ...app, 
          status: 'completed', 
          consultationNotes: notes || '',
          consultationDuration: durationMins
        };
      }
      return app;
    });
    localStorage.setItem('hospital_appointments', JSON.stringify(updatedApps));
    
    setActiveConsultation(null);
    setConsultationStartTime(null);
    loadAppointments(); // Refresh
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldPlus color="var(--color-primary)" size={28} />
          Doctor Portal
        </h2>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '999px', fontSize: '0.875rem' }}>
            <Users size={16} color="var(--color-primary)" />
            Dr. {user?.name} ({user?.specialization})
          </div>
          <button className="btn btn-outline hover-lift" onClick={logout} style={{ display: 'flex', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Feature Banner Image */}
      <div style={{ width: '100%', height: '140px', borderRadius: '16px', backgroundImage: 'url(/dashboard_banner_medical.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(9, 9, 11, 0.9), rgba(9, 9, 11, 0.4))' }}></div>
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '3rem' }}>
           <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome, Dr. {user?.name}</h3>
           <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage your active queue and patient flow.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Current Queue Load</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: '1' }}>
              {queueLength}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
              Patients Waiting
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Est. Queue Clear Time</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: '1' }}>
              {queueLength * 15}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>
              Minutes
            </div>
          </div>
        </div>

        {/* Right Column: Queue */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--color-primary)" /> Active Patient Queue
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '4rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                Your queue is completely empty. Great job!
              </div>
            ) : (
              appointments.map((app, index) => (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: index === 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.03)', border: index === 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--glass-border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                  {/* Status Indicator Line */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: index === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '1.125rem' }}>Patient: {app.patientName}</strong>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {app.urgency === 'Emergency' && (
                           <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             Emergency
                           </span>
                        )}
                        {index === 0 && activeConsultation !== app.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Activity size={12} className="spin" /> Next Up
                          </span>
                        )}
                        {activeConsultation === app.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Activity size={12} className="spin" /> In Consultation
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> {app.date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> {app.time}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {activeConsultation !== app.id ? (
                      <button 
                        className="btn btn-outline hover-lift" 
                        onClick={() => handleStartConsultation(app.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        <Play size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Start
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary hover-lift" 
                        onClick={() => handleCompleteAppointment(app.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                      >
                        <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> End & Save
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>My Schedule</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>{profile?.specialization} · {hospitalContext?.length || 0} active hospital context(s)</p>
        {scheduleError && <p style={{ color: 'var(--color-error)' }}>{scheduleError}</p>}
        {scheduleData.schedules.length === 0 ? <p>No work schedule configured.</p> : scheduleData.schedules.map((item) => (
          <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--glass-border)' }}>
            <strong>{item.dayOfWeek}</strong> · {new Date(item.startTime).toISOString().slice(11,16)}–{new Date(item.endTime).toISOString().slice(11,16)} · {item.department.name} · maximum {item.maximumPatients} patients
          </div>
        ))}
        <h4 style={{ marginTop: '1.5rem' }}>Upcoming leave and exceptions</h4>
        {scheduleData.exceptions.length === 0 ? <p>No upcoming exceptions.</p> : scheduleData.exceptions.map((item) => <div key={item.id}>{new Date(item.date).toISOString().slice(0,10)} · {item.exceptionType} {item.reason ? `· ${item.reason}` : ''}</div>)}
      </div>
    </div>
  );
};

export default DoctorDashboard;
