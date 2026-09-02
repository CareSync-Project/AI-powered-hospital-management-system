import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, ShieldPlus, Users, Database, LayoutDashboard, Upload, CheckCircle, Plus, FileSpreadsheet, Clock, Mail } from 'lucide-react';
import Phase4Management from '../components/admin/Phase4Management';
import ReviewAdminPanel from '../components/admin/ReviewAdminPanel';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    activeAppointments: 0,
    avgConsultTime: 0,
    pendingIdRequests: 0
  });

  const [hospitalUsers, setHospitalUsers] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [unassignedDoctors, setUnassignedDoctors] = useState([]);
  const [idRequests, setIdRequests] = useState([]);
  
  // Bulk Upload State
  const [uploadType, setUploadType] = useState('doctor'); // 'doctor' or 'patient'
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
    const appointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
    const requests = JSON.parse(localStorage.getItem('hospital_id_requests') || '[]');

    const hUsers = users.filter(u => u.hospitalId === user.hospitalId);
    const independentDoctors = users.filter(u => u.role === 'doctor' && !u.hospitalId);

    const doctorIds = hUsers.filter(u => u.role === 'doctor').map(d => d.id);
    const hAppointments = appointments.filter(a => doctorIds.includes(a.doctorId));
    const hRequests = requests.filter(r => r.hospitalId === user.hospitalId && r.status === 'pending');

    setHospitalUsers(hUsers);
    setUnassignedDoctors(independentDoctors);
    setAllAppointments(hAppointments);
    setIdRequests(hRequests);

    const completedApps = hAppointments.filter(a => a.status === 'completed' && a.consultationDuration);
    const totalConsultTime = completedApps.reduce((acc, curr) => acc + (parseInt(curr.consultationDuration) || 0), 0);
    const avgTime = completedApps.length > 0 ? Math.round(totalConsultTime / completedApps.length) : 0;

    setStats({
      totalPatients: hUsers.filter(u => u.role === 'patient').length,
      totalDoctors: hUsers.filter(u => u.role === 'doctor').length,
      totalAppointments: hAppointments.length,
      activeAppointments: hAppointments.filter(a => a.status === 'scheduled').length,
      avgConsultTime: avgTime,
      pendingIdRequests: hRequests.length
    });
  };

  useEffect(() => {
    loadData();
  }, [user.hospitalId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setUploadStatus('Legacy bulk account import is disabled because it stored plaintext passwords. Secure bulk provisioning will use the backend in a later phase.');
  };

  const handleAssociateDoctor = (doctorId) => {
    setUploadStatus(`Legacy doctor association for ${doctorId} is disabled. Use the authenticated staff API foundation.`);
  };

  const handleApproveIdRequest = (req) => {
    const newId = `PAT-${user.hospitalId.substr(-4)}-${Math.floor(Math.random() * 10000)}`;
    
    // 1. Update User Record
    const users = JSON.parse(localStorage.getItem('hospital_users') || '[]');
    const userIndex = users.findIndex(u => u.id === req.patientId);
    if (userIndex > -1) {
      if (!users[userIndex].hospitalPatientIds) {
        users[userIndex].hospitalPatientIds = {};
      }
      users[userIndex].hospitalPatientIds[req.hospitalId] = newId;
      localStorage.setItem('hospital_users', JSON.stringify(users));
    }

    // 2. Send Message to Patient Inbox
    const msgs = JSON.parse(localStorage.getItem('hospital_messages') || '[]');
    msgs.push({
      id: Date.now().toString(),
      patientId: req.patientId,
      title: 'New Hospital ID Generated',
      content: `Your request for a Patient ID at ${req.hospitalName} has been approved. Your new ID is: ${newId}. You can now book appointments.`,
      date: new Date().toLocaleDateString(),
      read: false
    });
    localStorage.setItem('hospital_messages', JSON.stringify(msgs));

    // 3. Remove Request
    const requests = JSON.parse(localStorage.getItem('hospital_id_requests') || '[]');
    const updatedRequests = requests.filter(r => r.id !== req.id);
    localStorage.setItem('hospital_id_requests', JSON.stringify(updatedRequests));

    loadData();
  };

  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { key: 'overview', label: 'AI Overview', icon: LayoutDashboard },
    { key: 'departments', label: 'Departments', icon: Database },
    { key: 'doctors', label: 'Doctors', icon: ShieldPlus },
    { key: 'schedules', label: 'Schedules', icon: Clock },
    { key: 'staff', label: 'Medical Staff', icon: Users },
    { key: 'directory', label: 'Staff Directory', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: Activity },
    { key: 'monitoring', label: 'Appointments', icon: Clock },
    { key: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { key: 'requests', label: 'ID Requests', icon: Mail, badge: stats.pendingIdRequests },
    { key: 'bulk-secure', label: 'Secure Import', icon: Upload },
    { key: 'import', label: 'Bulk Import', icon: Upload }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8fafc' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--color-background)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
            <div style={{ background: 'var(--color-primary)', color: '#004449', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <ShieldPlus size={20} />
            </div>
            CareSync Admin
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {user.name}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? '#004449' : 'var(--color-text-main)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? '#004449' : 'var(--color-text-muted)'} />
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--color-error)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    fontWeight: 'bold'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto' }}>
          <button
            className="btn hover-lift"
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'transparent', color: '#ff8a8a', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area (White Background) */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', backgroundColor: '#ffffff', color: '#0f172a' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', textTransform: 'capitalize', color: '#0f172a' }}>
              {activeTab.replace('-', ' ')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              CareSync Hospital Administration Console
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>
            <ShieldPlus size={16} color="#004449" />
            Single-Hospital System
          </div>
        </header>

        <div style={{ width: '100%', height: '120px', borderRadius: '16px', backgroundImage: 'url(/dashboard_banner_medical.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(9, 9, 11, 0.9), rgba(9, 9, 11, 0.5))' }}></div>
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '2rem' }}>
             <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Hospital Command Center</h3>
             <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Real-time facility management and clinical allocation metrics.</p>
          </div>
        </div>

        {['departments', 'doctors', 'schedules'].includes(activeTab) && <Phase4Management section={activeTab} />}
        {activeTab==='directory'&&<ReviewAdminPanel section="staff"/>}
        {activeTab==='analytics'&&<ReviewAdminPanel section="analytics"/>}
        {activeTab==='monitoring'&&<ReviewAdminPanel section="appointments"/>}
        {activeTab==='reports'&&<ReviewAdminPanel section="reports"/>}
        {activeTab==='bulk-secure'&&<ReviewAdminPanel section="bulk"/>}

      {activeTab === 'overview' && (
        <>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#005a60', fontWeight: '600' }}>
                <Users size={18} color="#004449" /> Total Patients
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>{stats.totalPatients}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#005a60', fontWeight: '600' }}>
                <ShieldPlus size={18} color="#004449" /> Active Doctors
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>{stats.totalDoctors}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#005a60', fontWeight: '600' }}>
                <Database size={18} color="#004449" /> Total Appts
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>{stats.totalAppointments}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #007A83' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#004449', fontWeight: '600' }}>
                <Activity size={18} color="#004449" /> Queued Appts
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>{stats.activeAppointments}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#005a60', fontWeight: '600' }}>
                <Clock size={18} color="#004449" /> Avg Consult Time
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>{stats.avgConsultTime}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#005a60', marginLeft: '4px' }}>min</span></div>
            </div>
          </div>

          <div className="grid-2-even">
            <div className="glass-panel" style={{ padding: '2rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)' }}>
                <Activity size={20} /> AI Queue Monitor (High Wait Times)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allAppointments.filter(app => app.status === 'scheduled' && app.waitTime >= 30).length === 0 ? (
                  <div style={{ color: 'var(--color-success)', fontSize: '0.875rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    All patient queues are currently healthy. No excessive wait times detected.
                  </div>
                ) : (
                  allAppointments.filter(app => app.status === 'scheduled' && app.waitTime >= 30).map(app => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>Patient: {app.patientName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Awaiting Dr. {app.doctorName} ({app.specialization})</div>
                      </div>
                      <div style={{ color: 'var(--color-error)', fontWeight: 'bold', fontSize: '0.875rem', alignSelf: 'center' }}>
                        {app.waitTime} min wait!
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Hospital Appointment Stream
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allAppointments.length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No appointments booked yet.</div>
                ) : (
                  allAppointments.slice().reverse().map(app => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>{app.patientName} → Dr. {app.doctorName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{app.date} at {app.time}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: app.status === 'scheduled' ? 'var(--color-warning)' : 'var(--color-success)', alignSelf: 'center', background: app.status === 'scheduled' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {app.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'requests' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} color="var(--color-primary)" /> Pending Patient ID Requests
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Patients have requested to register at this hospital. Approve to generate an ID and notify them automatically.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {idRequests.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                No pending requests.
              </div>
            ) : (
              idRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '1.125rem' }}>{req.patientName}</strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Requested on: {req.date}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleApproveIdRequest(req)}
                    className="btn btn-primary hover-lift"
                    style={{ padding: '0.5rem 1.5rem' }}
                  >
                    Generate & Send ID
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="grid-2">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Medical Staff Directory
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hospitalUsers.filter(u => u.role === 'doctor').length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No doctors registered yet.</div>
              ) : (
                hospitalUsers.filter(u => u.role === 'doctor').map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <strong>Dr. {doc.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{doc.email}</div>
                    </div>
                    <div style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>{doc.specialization}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--color-primary)" /> Unassigned Doctors
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              These doctors registered independently and are awaiting hospital association.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
              {unassignedDoctors.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                  No unassigned doctors available.
                </div>
              ) : (
                unassignedDoctors.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>Dr. {doc.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.1rem' }}>{doc.specialization}</div>
                    </div>
                    <button 
                      onClick={() => handleAssociateDoctor(doc.id)}
                      className="btn btn-primary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={24} color="var(--color-primary)" /> Bulk Import via Excel/CSV
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Upload an Excel (.xlsx) or CSV file containing your hospital records. The AI will extract the necessary data.
              <br/><br/>
              <strong>Doctor Format:</strong> Name, Email, Password, Department, Job Title, Ghana Card<br/>
              <strong>Patient Format:</strong> Name, Email, Password, Patient ID, Ghana Card
            </p>

            <form onSubmit={handleBulkUpload}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Record Type to Import</label>
                  <select className="input-field" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                    <option value="doctor">Doctors</option>
                    <option value="patient">Patients</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Upload File</label>
                <div style={{ 
                  border: '2px dashed var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '3rem', 
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <FileSpreadsheet size={48} color="var(--color-text-muted)" />
                    {file ? (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{file.name}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>Click to browse or drag and drop Excel/CSV file here</span>
                    )}
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary hover-lift" style={{ padding: '0.75rem 2rem' }}>Process CSV Records</button>
                {uploadStatus && (
                  <div style={{ fontSize: '0.875rem', color: uploadStatus.includes('Error') ? 'var(--color-error)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {uploadStatus.includes('Success') && <CheckCircle size={16} />} {uploadStatus}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default AdminDashboard;
