import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, ShieldPlus, Users, Database, LayoutDashboard, Upload, CheckCircle, Plus, FileSpreadsheet, Clock, Mail } from 'lucide-react';
import Phase4Management from '../components/admin/Phase4Management';

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

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard color="var(--color-primary)" size={28} />
          {user.name} Control Panel
        </h2>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '999px', fontSize: '0.875rem' }}>
            <ShieldPlus size={16} color="var(--color-primary)" />
            Hospital Admin
          </div>
          <button className="btn btn-outline hover-lift" onClick={logout} style={{ display: 'flex', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div style={{ width: '100%', height: '140px', borderRadius: '16px', backgroundImage: 'url(/dashboard_banner_medical.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(9, 9, 11, 0.9), rgba(9, 9, 11, 0.5))' }}></div>
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '3rem' }}>
           <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Hospital Overview</h3>
           <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Real-time facility capacity and AI allocation metrics.</p>
        </div>
      </div>

      <div className="flex-wrap" style={{ gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        {['hospital', 'departments', 'doctors', 'schedules'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`btn ${activeTab === tab ? 'btn-primary' : ''}`} style={{ textTransform: 'capitalize' }}>{tab}</button>
        ))}
        <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'overview' ? 'white' : 'var(--color-text-muted)' }}>AI Overview</button>
        <button onClick={() => setActiveTab('staff')} className={`btn ${activeTab === 'staff' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'staff' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'staff' ? 'white' : 'var(--color-text-muted)' }}>Medical Staff</button>
        <button onClick={() => setActiveTab('import')} className={`btn ${activeTab === 'import' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'import' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'import' ? 'white' : 'var(--color-text-muted)' }}>Bulk Import</button>
        <button onClick={() => setActiveTab('requests')} className={`btn ${activeTab === 'requests' ? 'btn-primary' : ''}`} style={{ position: 'relative', background: activeTab === 'requests' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'requests' ? 'white' : 'var(--color-text-muted)' }}>
          ID Requests
          {stats.pendingIdRequests > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-error)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '100vh', fontWeight: 'bold' }}>
              {stats.pendingIdRequests}
            </span>
          )}
        </button>
      </div>

      {['hospital', 'departments', 'doctors', 'schedules'].includes(activeTab) && <Phase4Management section={activeTab} />}

      {activeTab === 'overview' && (
        <>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                <Users size={18} /> Total Patients
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{stats.totalPatients}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                <ShieldPlus size={18} /> Active Doctors
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{stats.totalDoctors}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                <Database size={18} /> Total Appts
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{stats.totalAppointments}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'rgba(59, 130, 246, 0.3)', background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <Activity size={18} /> Queued Appts
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: 'var(--color-primary)' }}>{stats.activeAppointments}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                <Clock size={18} /> Avg Consult Time
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{stats.avgConsultTime}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '4px' }}>min</span></div>
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
    </div>
  );
};

export default AdminDashboard;
