import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { LogOut, Calendar, Clock, Activity, ShieldPlus, Building2, Wallet, FileText, XCircle, Search, User, Inbox, MessageSquare, CheckCircle } from 'lucide-react';

const AI_SPECIALTY_MAP = {
  "chest pain": "Cardiology",
  "heart": "Cardiology",
  "blood pressure": "Cardiology",
  "headache": "Neurology",
  "dizzy": "Neurology",
  "seizure": "Neurology",
  "child": "Pediatrics",
  "baby": "Pediatrics",
  "bone": "Orthopedics",
  "joint": "Orthopedics",
  "fracture": "Orthopedics",
  "skin": "Dermatology",
  "rash": "Dermatology",
  "cancer": "Oncology",
  "tumor": "Oncology",
  "tooth": "Dental",
  "teeth": "Dental",
  "eye": "Ophthalmology",
  "vision": "Ophthalmology",
  "mental": "Psychiatry",
  "depression": "Psychiatry",
  "anxiety": "Psychiatry",
  "urine": "Urology",
  "kidney": "Urology",
  "pregnancy": "Gynecology",
  "women": "Gynecology",
  "ear": "ENT",
  "nose": "ENT",
  "throat": "ENT",
  "therapy": "Physiotherapy",
  "surgery": "Surgery"
};

const determineSpecialty = (symptoms) => {
  const lowerSymptoms = symptoms.toLowerCase();
  for (const [keyword, specialty] of Object.entries(AI_SPECIALTY_MAP)) {
    if (lowerSymptoms.includes(keyword)) {
      return specialty;
    }
  }
  return "General Practice"; // Default fallback
};

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { simulateAppointmentNotifications } = useNotification();
  
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [messages, setMessages] = useState([]);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inbox'
  
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('Routine');
  const [bookingStatus, setBookingStatus] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [patientIdInput, setPatientIdInput] = useState('');
  
  const myHospitalIds = user?.hospitalPatientIds || {};

  useEffect(() => {
    const loadedAppointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
    setAppointments(loadedAppointments.filter(app => app.patientId === user.id));

    const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
    setDoctors(users.filter(u => u.role === 'doctor'));

    const loadedHospitals = JSON.parse(localStorage.getItem('hospital_hospitals') || '[]');
    setHospitals(loadedHospitals);

    const loadedMessages = JSON.parse(localStorage.getItem('hospital_messages') || '[]');
    setMessages(loadedMessages.filter(m => m.patientId === user.id));

  }, [user.id, bookingStatus]);

  const handleSmartBooking = () => {
    if (!selectedHospitalId) {
      setBookingStatus('Please select a hospital first.');
      return;
    }
    if (!symptoms.trim()) {
      setBookingStatus('Please describe your symptoms.');
      return;
    }

    setIsSearching(true);
    setBookingStatus('AI is analyzing symptoms to determine the best specialist...');
    
    setTimeout(() => {
      const assignedSpecialty = determineSpecialty(symptoms);
      
      const matchedDoctors = doctors.filter(d => 
        d.hospitalId === selectedHospitalId &&
        d.specialization && 
        d.specialization.toLowerCase() === assignedSpecialty.toLowerCase()
      );

      if (matchedDoctors.length === 0) {
        setIsSearching(false);
        setBookingStatus(`Our AI determined you need a ${assignedSpecialty}, but no doctors are currently available at this hospital.`);
        return;
      }

      const allAppointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
      
      let selectedDoctor = matchedDoctors[0];
      let minLoad = Infinity;

      matchedDoctors.forEach(doc => {
        const load = allAppointments.filter(a => a.doctorId === doc.id && a.status === 'scheduled').length;
        if (load < minLoad) {
          minLoad = load;
          selectedDoctor = doc;
        }
      });

      const urgencyMultiplier = urgency === 'Emergency' ? 0.1 : (urgency === 'Urgent' ? 0.5 : 1);
      const estimatedWaitMins = Math.round((minLoad * 15 + 5) * urgencyMultiplier); 
      const hospitalName = hospitals.find(h => h.id === selectedHospitalId)?.name || 'Hospital';

      const newAppointment = {
        id: Date.now().toString(),
        patientId: user.id,
        patientName: user.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        hospitalId: selectedHospitalId,
        hospitalName: hospitalName,
        status: 'scheduled',
        urgency: urgency,
        date: new Date().toLocaleDateString(),
        time: new Date(Date.now() + estimatedWaitMins * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        waitTime: estimatedWaitMins,
        symptoms: symptoms
      };

      const updatedApps = [...allAppointments, newAppointment];
      localStorage.setItem('hospital_appointments', JSON.stringify(updatedApps));
      
      setIsSearching(false);
      setBookingStatus(`Success! AI matched you with Dr. ${selectedDoctor.name} (${assignedSpecialty}). Est. wait: ${estimatedWaitMins} mins.`);
      setSymptoms('');
      setUrgency('Routine');
      
      simulateAppointmentNotifications(user.name, selectedDoctor.name, newAppointment.date, newAppointment.time);
      
    }, 2500);
  };

  const handleCancelAppointment = (appId) => {
    const allApps = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
    const updatedApps = allApps.map(a => {
      if (a.id === appId) {
        return { ...a, status: 'cancelled' };
      }
      return a;
    });
    localStorage.setItem('hospital_appointments', JSON.stringify(updatedApps));
    setAppointments(updatedApps.filter(app => app.patientId === user.id));
  };

  const handleVerifyId = () => {
    if (!patientIdInput.trim()) {
      setBookingStatus("Please enter an ID to verify.");
      return;
    }
    const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex > -1) {
      if (!users[userIndex].hospitalPatientIds) {
        users[userIndex].hospitalPatientIds = {};
      }
      users[userIndex].hospitalPatientIds[selectedHospitalId] = patientIdInput.trim();
      localStorage.setItem('hospital_users', JSON.stringify(users));
      
      window.location.reload();
    }
  };

  const handleRequestNewId = () => {
    if (!selectedHospitalId) return;
    
    const requests = JSON.parse(localStorage.getItem('hospital_id_requests') || '[]');
    const hospitalName = hospitals.find(h => h.id === selectedHospitalId)?.name || 'Unknown Hospital';
    
    // Check if already requested
    const existing = requests.find(r => r.patientId === user.id && r.hospitalId === selectedHospitalId);
    if (existing) {
      setBookingStatus("You already have a pending ID request for this hospital.");
      return;
    }

    requests.push({
      id: Date.now().toString(),
      patientId: user.id,
      patientName: user.name,
      hospitalId: selectedHospitalId,
      hospitalName: hospitalName,
      status: 'pending',
      date: new Date().toLocaleDateString()
    });
    
    localStorage.setItem('hospital_id_requests', JSON.stringify(requests));
    setBookingStatus("Request sent to Admin! Check your Inbox shortly for your new ID.");
  };

  const markMessageRead = (msgId) => {
    const allMsgs = JSON.parse(localStorage.getItem('hospital_messages') || '[]');
    const updated = allMsgs.map(m => m.id === msgId ? { ...m, read: true } : m);
    localStorage.setItem('hospital_messages', JSON.stringify(updated));
    setMessages(updated.filter(m => m.patientId === user.id));
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldPlus color="var(--color-primary)" size={28} />
          Patient Portal
        </h2>
        
        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="btn btn-outline" 
            style={{ borderColor: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--glass-border)' }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('inbox')} 
            className="btn btn-outline"
            style={{ position: 'relative', borderColor: activeTab === 'inbox' ? 'var(--color-primary)' : 'var(--glass-border)' }}
          >
            <Inbox size={16} style={{ marginRight: '0.5rem' }} /> Inbox
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-error)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '100vh', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '999px', fontSize: '0.875rem' }}>
            <User size={16} color="var(--color-primary)" />
            {user?.name || user?.email}
          </div>
          <button className="btn btn-outline hover-lift" onClick={logout} style={{ display: 'flex', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {activeTab === 'inbox' ? (
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Inbox size={20} color="var(--color-primary)" /> My Inbox
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '4rem 0' }}>
                Your inbox is empty.
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} onClick={() => markMessageRead(msg.id)} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(11, 255, 128, 0.1)', border: '1px solid var(--glass-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <MessageSquare size={24} color={msg.read ? 'var(--color-text-muted)' : 'var(--color-primary)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: msg.read ? 'var(--color-text-main)' : 'var(--color-primary)' }}>{msg.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{msg.date}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: '180px', borderRadius: '16px', backgroundImage: 'url(/dashboard_banner_medical.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0, 68, 73, 0.9), rgba(0, 68, 73, 0.3))' }}></div>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '3rem' }}>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Your health, prioritized.</h3>
               <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Our AI immediately connects you to available specialists.</p>
            </div>
          </div>

          <div className="grid-2">
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} color="var(--color-primary)" /> AI Smart Allocation
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
                Select a hospital and describe your symptoms. Our AI will automatically determine the best department and assign the fastest available doctor.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: 'auto' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Select Hospital</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} color="var(--color-primary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <select 
                      className="input-field" 
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      style={{ appearance: 'none', cursor: 'pointer', paddingLeft: '2.5rem' }}
                    >
                      <option value="" disabled>Choose a hospital...</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }}>▼</div>
                  </div>
                </div>

                {selectedHospitalId && !myHospitalIds[selectedHospitalId] && (
                  <div style={{ padding: '1rem', background: 'rgba(72, 60, 255, 0.1)', border: '1px solid rgba(72, 60, 255, 0.3)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                      <ShieldPlus size={16} /> Hospital ID Required
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      You must have a Patient ID for this hospital before booking.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Enter existing ID..." 
                        value={patientIdInput}
                        onChange={(e) => setPatientIdInput(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                      <button className="btn btn-outline" onClick={handleVerifyId} style={{ padding: '0.5rem' }}>Verify</button>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>OR</div>
                    <button className="btn hover-lift" onClick={handleRequestNewId} style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--color-secondary)', color: '#fff', border: 'none' }}>
                      Request New ID
                    </button>
                  </div>
                )}

                {selectedHospitalId && myHospitalIds[selectedHospitalId] && (
                  <div style={{ padding: '1rem', background: 'rgba(11, 255, 128, 0.1)', border: '1px solid rgba(11, 255, 128, 0.2)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> ID Verified: {myHospitalIds[selectedHospitalId]}
                    </label>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Symptoms / Reason for visit</label>
                  <textarea 
                    className="input-field" 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., I have been experiencing severe chest pain..."
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Urgency/Triage Level</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      className="input-field" 
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      style={{ appearance: 'none', cursor: 'pointer', border: urgency === 'Emergency' ? '1px solid var(--color-error)' : '1px solid var(--glass-border)' }}
                    >
                      <option value="Routine">Routine Checkup</option>
                      <option value="Urgent">Urgent (Prioritize Slot)</option>
                      <option value="Emergency">Emergency (Immediate)</option>
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }}>▼</div>
                  </div>
                </div>

                <button 
                  className="btn hover-lift" 
                  onClick={handleSmartBooking}
                  disabled={isSearching || (selectedHospitalId && !myHospitalIds[selectedHospitalId])}
                  style={{ opacity: isSearching || (selectedHospitalId && !myHospitalIds[selectedHospitalId]) ? 0.5 : 1, marginTop: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-background)', border: 'none' }}
                >
                  {isSearching ? 'Analyzing...' : 'Book Fastest Slot'}
                </button>
                
                {bookingStatus && (
                  <div style={{ padding: '1rem', marginTop: '0.5rem', background: bookingStatus.includes('Success') ? 'rgba(11, 255, 128, 0.1)' : 'rgba(72, 60, 255, 0.1)', color: bookingStatus.includes('Success') ? 'var(--color-primary)' : 'var(--color-secondary)', borderRadius: '8px', fontSize: '0.875rem', border: `1px solid ${bookingStatus.includes('Success') ? 'rgba(11, 255, 128, 0.2)' : 'rgba(72, 60, 255, 0.2)'}`, display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: '1.4' }}>
                    {bookingStatus.includes('Success') ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> : <Activity size={16} className={isSearching ? 'spin' : ''} style={{ flexShrink: 0, marginTop: '2px' }} />}
                    {bookingStatus}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--color-primary)" /> My Itinerary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointments.filter(a => a.status === 'scheduled').length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '4rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                    No active appointments. Use the smart booking tool to get started.
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'scheduled').map(app => (
                    <div key={app.id} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: app.urgency === 'Emergency' ? 'var(--color-error)' : 'var(--color-primary)' }}></div>
                      
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <User size={24} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-main)' }}>Dr. {app.doctorName}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {app.urgency === 'Emergency' && (
                              <span style={{ fontSize: '0.75rem', color: '#ff8a8a', background: 'rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '100vh', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                                Emergency
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(11, 255, 128, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '100vh', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ color: 'var(--color-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                          {app.specialization} at {app.hospitalName || 'Hospital'}
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> {app.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> {app.time}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-warning)' }}><Activity size={14} /> Est. Wait: {app.waitTime} min</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleCancelAppointment(app.id)}
                          className="btn hover-lift" 
                          style={{ padding: '0.5rem', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '50%' }}
                          title="Cancel Appointment"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--color-primary)" /> Medical History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointments.filter(a => a.status === 'completed').length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                    No completed appointments yet.
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'completed').map(app => (
                    <div key={app.id} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '1rem' }}>Dr. {app.doctorName} ({app.specialization})</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{app.date}</span>
                        </div>
                        {app.consultationNotes ? (
                          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--color-text-main)', borderLeft: '2px solid var(--color-primary)' }}>
                            "{app.consultationNotes}"
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No notes provided.</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} color="var(--color-primary)" /> My Hospital IDs
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                 {Object.keys(myHospitalIds).length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No hospital IDs generated yet. Book your first appointment!</div>
                 ) : (
                    Object.keys(myHospitalIds).map(hId => {
                      const hName = hospitals.find(h => h.id === hId)?.name || 'Unknown Hospital';
                      return (
                        <div key={hId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <Building2 size={20} color="var(--color-primary)" />
                             <div>
                               <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{hName}</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Patient Registration</div>
                             </div>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.875rem', letterSpacing: '0.05em', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)' }}>
                            {myHospitalIds[hId]}
                          </div>
                        </div>
                      )
                    })
                 )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
