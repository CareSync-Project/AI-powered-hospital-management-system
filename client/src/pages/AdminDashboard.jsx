import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, ShieldPlus, Users, Database, LayoutDashboard, CheckCircle, FileSpreadsheet, Clock, Mail, Bell } from 'lucide-react';
import Phase4Management from '../components/admin/Phase4Management';
import ReviewAdminPanel from '../components/admin/ReviewAdminPanel';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { adminReviewService } from '../services/adminReviewService';

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

  const [allAppointments, setAllAppointments] = useState([]);
  const [idRequests, setIdRequests] = useState([]);

  const loadData = async () => {
    try {
      const res = await adminReviewService.analytics();
      if (res.data) {
        setStats({
          totalPatients: res.data.totalPatients || 0,
          totalDoctors: res.data.doctors || 0,
          totalAppointments: res.data.appointmentsMonth || 0,
          activeAppointments: res.data.pendingConfirmed || 0,
          avgConsultTime: 15,
          pendingIdRequests: 0
        });
      }
    } catch (err) {
      console.error('Failed to load overview analytics:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveIdRequest = (req) => {
    const newId = `PAT-${Date.now()}`;
    const msgs = JSON.parse(localStorage.getItem('hospital_messages') || '[]');
    msgs.push({
      id: Date.now().toString(),
      patientId: req.patientId,
      title: 'New Hospital ID Generated',
      content: `Your request for a Patient ID at ${req.hospitalName} has been approved. Your new ID is: ${newId}.`,
      date: new Date().toLocaleDateString(),
      read: false
    });
    localStorage.setItem('hospital_messages', JSON.stringify(msgs));
    const requests = JSON.parse(localStorage.getItem('hospital_id_requests') || '[]');
    localStorage.setItem('hospital_id_requests', JSON.stringify(requests.filter(r => r.id !== req.id)));
    loadData();
  };

  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { key: 'overview',       label: 'Overview',       icon: LayoutDashboard },
    { key: 'analytics',      label: 'Analytics',      icon: Activity },
    { key: 'appointments',   label: 'Appointments',   icon: Clock },
    { key: 'departments',    label: 'Departments',    icon: Database },
    { key: 'staff',          label: 'Medical Staff',  icon: Users },
    { key: 'reports',        label: 'Reports',        icon: FileSpreadsheet },
    { key: 'announcements',  label: 'Announcements',  icon: Bell },
    { key: 'requests',       label: 'ID Requests',    icon: Mail, badge: stats.pendingIdRequests }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--color-background)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
            <div style={{ background: 'var(--color-primary)', color: '#004449', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <ShieldPlus size={20} />
            </div>
            CareSync Admin
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {user?.name || 'Administrator'}
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

        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <button
            className="btn hover-lift"
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'transparent', color: '#ff8a8a', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', backgroundColor: '#ffffff', color: '#0f172a' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', textTransform: 'capitalize', color: '#0f172a' }}>
              {activeTab.replace(/-/g, ' ')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              CareSync Hospital Administration Console
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('announcements')}
              style={{
                position: 'relative', background: '#f1f5f9', border: '1px solid #cbd5e1',
                padding: '0.55rem', borderRadius: '50%', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#004449'
              }}
              title="Announcements Console"
            >
              <Bell size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>
              <ShieldPlus size={16} color="#004449" />
              Single-Hospital System
            </div>
          </div>
        </header>

        {/* Command Center Banner — Overview only */}
        {activeTab === 'overview' && (
          <div style={{ width: '100%', height: '120px', borderRadius: '16px', backgroundImage: 'url(/dashboard_banner_medical.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(9,9,11,0.9), rgba(9,9,11,0.5))' }}></div>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: '#ffffff' }}>Hospital Command Center</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Real-time facility management and clinical allocation metrics.</p>
            </div>
          </div>
        )}

        {/* Tab content routing */}
        <ErrorBoundary key={activeTab}>
          {['departments', 'schedules'].includes(activeTab) && <Phase4Management section={activeTab} />}
          {activeTab === 'staff'          && <ReviewAdminPanel section="staff" />}
          {activeTab === 'analytics'      && <ReviewAdminPanel section="analytics" />}
          {(activeTab === 'appointments' || activeTab === 'monitoring') && <ReviewAdminPanel section="appointments" />}
          {activeTab === 'reports'        && <ReviewAdminPanel section="reports" />}
          {activeTab === 'announcements'  && <ReviewAdminPanel section="announcements" />}
        </ErrorBoundary>

        {/* Overview KPI Cards */}
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
                <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: '#004449' }}>
                  {stats.avgConsultTime}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#005a60', marginLeft: '4px' }}>min</span>
                </div>
              </div>
            </div>

            <div className="grid-2-even">
              <div className="glass-panel" style={{ padding: '2rem', borderColor: 'rgba(239,68,68,0.3)' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)' }}>
                  <Activity size={20} /> AI Queue Monitor (High Wait Times)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {allAppointments.filter(app => app.status === 'scheduled' && app.waitTime >= 30).length === 0 ? (
                    <div style={{ color: 'var(--color-success)', fontSize: '0.875rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      All patient queues are currently healthy. No excessive wait times detected.
                    </div>
                  ) : (
                    allAppointments.filter(app => app.status === 'scheduled' && app.waitTime >= 30).map(app => (
                      <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
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
                        <div style={{ fontSize: '0.75rem', color: app.status === 'scheduled' ? 'var(--color-warning)' : 'var(--color-success)', alignSelf: 'center', background: app.status === 'scheduled' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
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

        {/* ID Requests */}
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
                      Generate &amp; Send ID
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
