import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, LogOut, Stethoscope, Clock, FileSpreadsheet, Bell, User, CheckCircle2, ChevronRight, AlertCircle, FileText, HeartPulse, Plus, Trash2, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clinicalWorkflowService } from '../services/clinicalWorkflowService';
import { notificationService } from '../services/notificationService';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { consultationService } from '../services/consultationService';
import { doctorService } from '../services/doctorService';
import VitalSummary from '../components/nurse/VitalSummary';
import UrgencyBadge from '../components/nurse/UrgencyBadge';
import ClinicalAssessmentSummary from '../components/symptoms/ClinicalAssessmentSummary';
import '../clinical.css';

const blankForm = {
  chiefComplaint: '',
  clinicalObservations: '',
  consultationNotes: '',
  diagnosis: '',
  treatmentPlan: '',
  followUpRequired: false,
  followUpDate: ''
};

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'TRIAGED', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'MISSED'];

const STATUS_CONFIG = {
  PENDING:         { label: 'Pending',         bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  CONFIRMED:       { label: 'Confirmed',       bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  CHECKED_IN:      { label: 'Checked In',      bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  TRIAGED:         { label: 'Triaged',         bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  WAITING:         { label: 'Waiting',         bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
  IN_CONSULTATION: { label: 'In Consultation', bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  COMPLETED:       { label: 'Completed',       bg: '#15803d', text: '#ffffff', border: '#15803d' },
  CANCELLED:       { label: 'Cancelled',       bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  MISSED:          { label: 'Missed',          bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
};

export default function DoctorDashboard() {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');

  // Clinical state
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [schedule, setSchedule] = useState({ schedules: [], exceptions: [], departments: [], hospitals: [] });
  const [allAppointments, setAllAppointments] = useState([]);
  const [reports, setReports] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Appointments Console Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Self-Scheduling Form State
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '17:00',
    departmentId: '',
    consultationDurationMinutes: 15,
    maximumPatients: 20
  });
  const [addingSchedule, setAddingSchedule] = useState(false);

  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    exceptionType: 'UNAVAILABLE',
    reason: ''
  });
  const [addingException, setAddingException] = useState(false);

  // UI state
  const [message, setMessage] = useState('');
  const [savingConsult, setSavingConsult] = useState(false);

  // Defensive isolated data loaders
  const loadQueue = async () => {
    try {
      const res = await clinicalWorkflowService.doctorQueue();
      setQueue(res.data || []);
    } catch (err) {
      console.error('Doctor queue load error:', err.message);
    }
  };

  const loadSchedule = async () => {
    try {
      const res = await doctorService.mySchedule();
      const data = res.data?.data || res.data || { schedules: [], exceptions: [], departments: [], hospitals: [] };
      setSchedule(data);
      if (data.departments?.length && !scheduleForm.departmentId) {
        setScheduleForm(prev => ({ ...prev, departmentId: data.departments[0].id }));
      }
    } catch (err) {
      console.error('Doctor schedule load error:', err.message);
    }
  };

  const loadAllAppointments = async () => {
    try {
      const res = await doctorService.allAppointments();
      const list = res.data?.data || res.data || [];
      setAllAppointments(list);
    } catch (err) {
      console.error('Doctor appointments load error:', err.message);
    }
  };

  const loadReports = async () => {
    try {
      const res = await doctorService.reports();
      setReports(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Doctor reports load error:', err.message);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await doctorService.notifications();
      const list = res.data?.data || res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('Doctor notifications load error:', err.message);
    }
  };

  const refreshAll = () => {
    loadQueue();
    loadSchedule();
    loadAllAppointments();
    loadReports();
    loadNotifications();
  };

  useEffect(() => {
    refreshAll();
    const timer = setInterval(loadQueue, 30000);
    return () => clearInterval(timer);
  }, []);

  const openPatient = async (item) => {
    setMessage('');
    try {
      const res = await consultationService.context(item.id);
      const ctx = res.data?.data || res.data || res;
      setSelected(ctx);
      if (ctx.consultation) {
        setForm({
          ...blankForm,
          ...ctx.consultation,
          followUpDate: ctx.consultation.followUpDate ? ctx.consultation.followUpDate.slice(0, 10) : ''
        });
      } else {
        setForm({
          ...blankForm,
          chiefComplaint: ctx.triageRecords?.[0]?.chiefComplaint || ctx.reasonForVisit || ''
        });
      }
    } catch (err) {
      setMessage(`Error loading patient record: ${err.message}`);
    }
  };

  const startConsultation = async () => {
    if (!selected) return;
    setMessage('');
    try {
      await consultationService.start(selected.id);
      await openPatient(selected);
      await loadQueue();
      await loadAllAppointments();
    } catch (err) {
      setMessage(`Error starting consultation: ${err.message}`);
    }
  };

  const saveDraft = async () => {
    if (!selected) return;
    setSavingConsult(true);
    setMessage('');
    try {
      const payload = { ...form, followUpDate: form.followUpDate || null };
      await consultationService.save(selected.id, payload);
      setMessage('✓ Consultation draft saved successfully.');
    } catch (err) {
      setMessage(`Error saving draft: ${err.message}`);
    } finally {
      setSavingConsult(false);
    }
  };

  const completeConsultation = async () => {
    if (!selected) return;
    if (!window.confirm('Are you sure you want to complete this consultation? The appointment will be marked COMPLETED.')) return;
    setSavingConsult(true);
    setMessage('');
    try {
      const payload = { ...form, followUpDate: form.followUpDate || null };
      await consultationService.complete(selected.id, payload);
      setSelected(null);
      setForm(blankForm);
      setMessage('✓ Consultation completed successfully.');
      await refreshAll();
    } catch (err) {
      setMessage(`Error completing consultation: ${err.message}`);
    } finally {
      setSavingConsult(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    setUpdatingStatusId(appointmentId);
    setMessage('');
    try {
      await doctorService.updateStatus(appointmentId, newStatus);
      setMessage(`✓ Appointment status changed to ${newStatus.replaceAll('_', ' ')}.`);
      await loadAllAppointments();
      await loadQueue();
    } catch (err) {
      setMessage(`Error updating status: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.departmentId) {
      setMessage('Please select a department for your schedule.');
      return;
    }
    setAddingSchedule(true);
    setMessage('');
    try {
      await doctorService.createMySchedule({
        dayOfWeek: scheduleForm.dayOfWeek,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        departmentId: scheduleForm.departmentId,
        consultationDurationMinutes: Number(scheduleForm.consultationDurationMinutes),
        maximumPatients: Number(scheduleForm.maximumPatients)
      });
      setMessage('✓ Available shift added to your weekly schedule!');
      await loadSchedule();
    } catch (err) {
      setMessage(`Error adding schedule: ${err.response?.data?.message || err.message}`);
    } finally {
      setAddingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to remove this shift from your weekly schedule?')) return;
    setMessage('');
    try {
      await doctorService.deleteMySchedule(id);
      setMessage('✓ Shift removed from your schedule.');
      await loadSchedule();
    } catch (err) {
      setMessage(`Error removing schedule: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    if (!exceptionForm.date) {
      setMessage('Please select a date for unavailability/leave.');
      return;
    }
    setAddingException(true);
    setMessage('');
    try {
      await doctorService.createMyException({
        date: exceptionForm.date,
        exceptionType: exceptionForm.exceptionType,
        reason: exceptionForm.reason || 'Personal unavailability'
      });
      setMessage('✓ Unavailability date recorded.');
      setExceptionForm({ date: '', exceptionType: 'UNAVAILABLE', reason: '' });
      await loadSchedule();
    } catch (err) {
      setMessage(`Error adding exception: ${err.response?.data?.message || err.message}`);
    } finally {
      setAddingException(false);
    }
  };

  // Filtered Appointments Computation
  const filteredAppointments = allAppointments.filter((item) => {
    // Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

    // Date Filter
    const apptDateStr = item.appointmentDate ? new Date(item.appointmentDate).toISOString().slice(0, 10) : '';
    const todayStr = new Date().toISOString().slice(0, 10);
    if (dateFilter === 'TODAY' && apptDateStr !== todayStr) return false;
    if (dateFilter === 'UPCOMING' && apptDateStr < todayStr) return false;
    if (dateFilter === 'PAST' && apptDateStr >= todayStr) return false;

    // Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const patientName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
      const apptNum = (item.appointmentNumber || '').toLowerCase();
      const deptName = (item.department?.name || '').toLowerCase();
      if (!patientName.includes(q) && !apptNum.includes(q) && !deptName.includes(q)) return false;
    }

    return true;
  });

  const navItems = [
    { key: 'queue',         label: 'My Queue',            icon: Stethoscope, badge: queue.length },
    { key: 'appointments',  label: 'All Appointments',    icon: CalendarDays, badge: allAppointments.length },
    { key: 'reports',       label: 'My Reports',          icon: FileSpreadsheet },
    { key: 'schedule',      label: 'My Availability Schedule', icon: Clock },
    { key: 'announcements', label: 'Announcements',       icon: Bell,        badge: unreadCount }
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
        {/* Brand Header */}
        <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            <div style={{ background: 'var(--color-primary)', color: '#004449', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Stethoscope size={20} />
            </div>
            Doctor Portal
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.6rem', fontWeight: '600' }}>
            Dr. {user?.name || 'Practitioner'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {profile?.specialization || 'Medical Practitioner'}
          </div>
        </div>

        {/* Navigation Items */}
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
                    background: isActive ? '#004449' : 'var(--color-primary)',
                    color: isActive ? '#ffffff' : '#004449',
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
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

        {/* Action & Logout Section */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.65rem', backgroundColor: 'transparent', color: '#ff8a8a',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', backgroundColor: '#ffffff', color: '#0f172a' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', textTransform: 'capitalize', color: '#0f172a', margin: 0 }}>
              {activeTab === 'queue' ? 'Clinical Patient Queue' : activeTab === 'appointments' ? 'All Scheduled Appointments' : activeTab === 'schedule' ? 'My Availability Schedule' : activeTab.replace(/-/g, ' ')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              CareSync Clinical Practitioner Workspace
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
              title="Announcements & Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#dc2626',
                  color: '#ffffff', fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.35rem',
                  borderRadius: '999px', border: '2px solid #ffffff'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>
              <Stethoscope size={16} color="#004449" />
              Dr. {profile?.lastName || 'Practitioner'}
            </div>
          </div>
        </header>

        {/* Global Alert Message Banner */}
        {message && (
          <div style={{
            marginBottom: '1.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px',
            backgroundColor: message.startsWith('✓') ? '#dcfce7' : '#fee2e2',
            color: message.startsWith('✓') ? '#15803d' : '#b91c1c',
            border: `1px solid ${message.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            {message.startsWith('✓') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message}
          </div>
        )}

        {/* TAB VIEWS WRAPPED IN ERROR BOUNDARY */}
        <ErrorBoundary key={activeTab}>
          {/* TAB 1: MY QUEUE (Clinical Workspace) */}
          {activeTab === 'queue' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>
            {/* Worklist Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Queue Status KPI Summary */}
              <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Queue Overview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                    <div style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: '600' }}>Waiting</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c2410c' }}>
                      {queue.filter(x => x.status === 'WAITING').length}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>Active</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d' }}>
                      {queue.filter(x => x.status === 'IN_CONSULTATION').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Queue Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {queue.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                    No patients currently in your queue.
                  </div>
                ) : (
                  queue.map((item) => {
                    const isSel = selected?.id === item.id;
                    const urgency = item.triageRecords?.[0]?.urgencyLevel || 'ROUTINE';
                    return (
                      <button
                        key={item.id}
                        onClick={() => openPatient(item)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          border: isSel ? '2px solid #004449' : '1px solid #e2e8f0',
                          backgroundColor: isSel ? '#f0fdfa' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSel ? '0 4px 12px rgba(0,68,73,0.08)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                            {item.patient?.firstName} {item.patient?.lastName}
                          </strong>
                          <UrgencyBadge level={urgency} />
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>{item.appointmentNumber}</span> ·
                          <span>{item.department?.name}</span>
                        </div>

                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                            color: item.status === 'IN_CONSULTATION' ? '#15803d' : '#c2410c',
                            backgroundColor: item.status === 'IN_CONSULTATION' ? '#dcfce7' : '#ffedd5',
                            padding: '0.15rem 0.5rem', borderRadius: '4px'
                          }}>
                            {item.status.replaceAll('_', ' ')}
                          </span>
                          <ChevronRight size={14} color="#94a3b8" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Consultation Form & Clinical Record Main View */}
            <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px', minHeight: '600px' }}>
              {!selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Activity size={32} color="#004449" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', marginBottom: '0.5rem' }}>Select an Assigned Patient</h3>
                  <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: 0, color: '#64748b' }}>
                    Choose a waiting or active patient from your queue list on the left to review vitals and record consultation findings.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Patient Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {selected.patient?.firstName} {selected.patient?.lastName}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Appointment: <strong>{selected.appointmentNumber}</strong> · Department: <strong>{selected.department?.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#005a60', marginTop: '0.25rem', fontWeight: '500' }}>
                        Reason for visit: {selected.reasonForVisit || 'Not specified'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <UrgencyBadge level={selected.triageRecords?.[0]?.urgencyLevel} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Change Status:</span>
                        <select
                          value={selected.status}
                          onChange={(e) => handleUpdateAppointmentStatus(selected.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                            backgroundColor: STATUS_CONFIG[selected.status]?.bg || '#f1f5f9',
                            color: STATUS_CONFIG[selected.status]?.text || '#0f172a',
                            border: `1px solid ${STATUS_CONFIG[selected.status]?.border || '#cbd5e1'}`, cursor: 'pointer'
                          }}
                        >
                          {ALL_STATUSES.map(st => (
                            <option key={st} value={st}>{st.replaceAll('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* AI Symptom Assessment Summary */}
                  {selected.symptomAssessments?.[0] && (
                    <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <ClinicalAssessmentSummary assessment={selected.symptomAssessments[0]} />
                    </div>
                  )}

                  {/* Triage & Vitals Card */}
                  <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#004449', marginBottom: '0.5rem', margin: 0 }}>
                      Triage Summary & Latest Verified Vitals
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', marginTop: '0.25rem' }}>
                      <strong>Chief Complaint:</strong> {selected.triageRecords?.[0]?.chiefComplaint || 'No triage summary available.'}
                    </p>
                    <VitalSummary vital={selected.vitalRecords?.find(x => x.verificationStatus === 'VERIFIED')} />
                  </div>

                  {/* Consultation Action: Start or Record */}
                  {selected.status === 'WAITING' ? (
                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '1.1rem', color: '#15803d', fontWeight: '700', marginBottom: '0.5rem', margin: 0 }}>
                        Patient Ready for Consultation
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '1.25rem' }}>
                        Click below to commence the consultation and enable clinical notes entry.
                      </p>
                      <button
                        onClick={startConsultation}
                        style={{
                          padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #004449, #007A83)',
                          color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer'
                        }}
                      >
                        🩺 Start Consultation Now
                      </button>
                    </div>
                  ) : (
                    /* Consultation Notes Form */
                    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#004449', margin: 0 }}>
                        Consultation Clinical Documentation
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                            Chief Complaint *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={form.chiefComplaint}
                            onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                            Clinical Observations
                          </label>
                          <textarea
                            rows={3}
                            value={form.clinicalObservations}
                            onChange={(e) => setForm({ ...form, clinicalObservations: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                          Consultation Notes
                        </label>
                        <textarea
                          rows={4}
                          value={form.consultationNotes}
                          onChange={(e) => setForm({ ...form, consultationNotes: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                            Clinician Diagnosis *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={form.diagnosis}
                            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                            Treatment Plan & Prescriptions *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={form.treatmentPlan}
                            onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>

                      {/* Follow-up recommendation */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#004449', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.followUpRequired}
                            onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
                          />
                          Follow-up consultation recommended
                        </label>

                        {form.followUpRequired && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Follow-up Date:</label>
                            <input
                              type="date"
                              required
                              value={form.followUpDate}
                              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Consultation Controls */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          disabled={savingConsult}
                          onClick={saveDraft}
                          style={{
                            padding: '0.7rem 1.5rem', backgroundColor: '#f1f5f9', color: '#0f172a',
                            border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer'
                          }}
                        >
                          Save Draft
                        </button>

                        <button
                          type="button"
                          disabled={savingConsult}
                          onClick={completeConsultation}
                          style={{
                            padding: '0.7rem 1.75rem', background: 'linear-gradient(135deg, #004449, #007A83)',
                            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer'
                          }}
                        >
                          ✓ Complete Consultation
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL APPOINTMENTS MANAGEMENT CONSOLE */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filter & Search Bar */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#004449', margin: 0 }}>Appointments Console</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                    View and update status for all assigned patient appointments.
                  </p>
                </div>
                {/* Search input */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search patient, appt #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginRight: '0.25rem' }}>Status:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
                    backgroundColor: statusFilter === 'ALL' ? '#004449' : '#f1f5f9',
                    color: statusFilter === 'ALL' ? '#ffffff' : '#475569',
                    border: 'none'
                  }}
                >
                  All ({allAppointments.length})
                </button>
                {ALL_STATUSES.map(st => {
                  const cfg = STATUS_CONFIG[st];
                  const cnt = allAppointments.filter(x => x.status === st).length;
                  const isSel = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
                        backgroundColor: isSel ? '#004449' : cfg.bg,
                        color: isSel ? '#ffffff' : cfg.text,
                        border: isSel ? 'none' : `1px solid ${cfg.border}`
                      }}
                    >
                      {cfg.label} ({cnt})
                    </button>
                  );
                })}
              </div>

              {/* Date Scope Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginRight: '0.25rem' }}>Time Range:</span>
                {['ALL', 'TODAY', 'UPCOMING', 'PAST'].map(scope => (
                  <button
                    key={scope}
                    onClick={() => setDateFilter(scope)}
                    style={{
                      padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                      backgroundColor: dateFilter === scope ? '#007A83' : '#f8fafc',
                      color: dateFilter === scope ? '#ffffff' : '#64748b',
                      border: dateFilter === scope ? 'none' : '1px solid #e2e8f0'
                    }}
                  >
                    {scope.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Table Stream */}
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              {filteredAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', fontSize: '0.875rem', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                  No appointments found matching your current filter criteria.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredAppointments.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                    const isUpdating = updatingStatusId === item.id;
                    const apptDateStr = item.appointmentDate ? new Date(item.appointmentDate).toISOString().slice(0, 10) : 'N/A';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                          padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
                        }}
                      >
                        {/* Patient & Appointment Details */}
                        <div style={{ flex: '1 1 280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                              {item.patient?.firstName} {item.patient?.lastName}
                            </strong>
                            {item.patient?.phone && (
                              <span style={{ fontSize: '0.78rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                📞 {item.patient.phone}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#005a60', marginTop: '0.35rem', fontWeight: '500' }}>
                            Appt #: <strong>{item.appointmentNumber}</strong> · Department: <strong>{item.department?.name || 'General'}</strong>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                            📅 Date: <strong>{apptDateStr}</strong> ({item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 'Scheduled Shift'})
                          </div>
                        </div>

                        {/* Interactive Status Changer Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>
                              Update Status
                            </div>
                            <select
                              disabled={isUpdating}
                              value={item.status}
                              onChange={(e) => handleUpdateAppointmentStatus(item.id, e.target.value)}
                              style={{
                                padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700',
                                backgroundColor: cfg.bg, color: cfg.text, border: `1.5px solid ${cfg.border}`,
                                cursor: 'pointer', outline: 'none'
                              }}
                            >
                              {ALL_STATUSES.map(st => (
                                <option key={st} value={st} style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                                  {st.replaceAll('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quick Consultation Shortcut for WAITING / IN_CONSULTATION */}
                          {['WAITING', 'IN_CONSULTATION'].includes(item.status) && (
                            <button
                              onClick={() => {
                                setActiveTab('queue');
                                openPatient(item);
                              }}
                              style={{
                                padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #004449, #007A83)',
                                color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
                              }}
                            >
                              🩺 Open Consult
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY REPORTS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449', marginBottom: '1.25rem' }}>Completed Consultation Performance</h3>
              {reports ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Completed Today</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#004449' }}>{reports.completedToday ?? 0}</div>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Completed This Week</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#004449' }}>{reports.completedWeek ?? 0}</div>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Completed This Month</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#004449' }}>{reports.completedMonth ?? 0}</div>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Follow-ups Recommended</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#004449' }}>{reports.followUpCount ?? 0}</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#004449', marginBottom: '0.75rem' }}>Consultation Status Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {reports.statuses?.map((item) => (
                      <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem' }}>
                        <span>{item.status}</span>
                        <strong>{item.count} consultations</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading report statistics...</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MY SCHEDULE (DOCTOR SELF-SCHEDULING) */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Doctor Self-Scheduling Form */}
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#004449', margin: 0 }}>Schedule Available Weekly Shift</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Set your available days and time slots for patient appointments during the week.</p>
              </div>

              <form onSubmit={handleAddSchedule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Day of Week *
                  </label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Department *
                  </label>
                  <select
                    required
                    value={scheduleForm.departmentId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, departmentId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    {schedule.departments?.length ? (
                      schedule.departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                    ) : (
                      <option value="">No departments available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Appt Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={scheduleForm.consultationDurationMinutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, consultationDurationMinutes: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Max Patients Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={scheduleForm.maximumPatients}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maximumPatients: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    disabled={addingSchedule}
                    style={{
                      padding: '0.75rem 1.75rem', background: 'linear-gradient(135deg, #004449, #007A83)',
                      color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    <Plus size={18} /> Add Available Shift
                  </button>
                </div>
              </form>
            </div>

            {/* Configured Weekly Availability List */}
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449', marginBottom: '1.25rem' }}>Configured Availability Shifts for the Week</h3>
              {!schedule.schedules?.length ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontSize: '0.875rem', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                  No available shifts configured yet. Use the form above to add your working days and hours for the week.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {schedule.schedules.map((item) => (
                    <div key={item.id} style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#004449', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                            {item.dayOfWeek}
                          </span>
                          <button
                            onClick={() => handleDeleteSchedule(item.id)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                            title="Remove shift"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.35rem' }}>
                          {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} – {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#005a60', marginTop: '0.35rem', fontWeight: '600' }}>
                          Department: {item.department?.name || 'General Practice'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Capacity: {item.maximumPatients || 20} max patients · {item.consultationDurationMinutes || 15} mins/appt
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unavailability & Leave Exception Logger */}
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449', margin: 0 }}>Mark Unavailability / Leave Date</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Log dates you will be away on leave or unavailable so patient bookings are disabled for those dates.</p>
              </div>

              <form onSubmit={handleAddException} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Unavailable Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={exceptionForm.date}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#005a60', display: 'block', marginBottom: '0.35rem' }}>
                    Reason / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leave, Conference, Personal"
                    value={exceptionForm.reason}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={addingException}
                    style={{
                      padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', color: '#0f172a',
                      border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer'
                    }}
                  >
                    Log Unavailability
                  </button>
                </div>
              </form>

              {schedule.exceptions?.length > 0 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#004449', margin: '0 0 0.5rem 0' }}>Logged Unavailability Exceptions:</h4>
                  {schedule.exceptions.map(exc => (
                    <div key={exc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', fontSize: '0.85rem', color: '#c2410c' }}>
                      <span><strong>{exc.date.slice(0, 10)}</strong> — {exc.reason || exc.exceptionType}</span>
                      <span style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>{exc.exceptionType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ANNOUNCEMENTS & NOTIFICATIONS */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: '#004449', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449', margin: 0 }}>Announcements & Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await doctorService.markAllNotificationsRead();
                        await loadNotifications();
                      } catch (err) {
                        console.error('Failed to mark notifications read:', err.message);
                      }
                    }}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600', color: '#004449' }}
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontSize: '0.875rem', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                  No announcements or notifications received yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '1.25rem', borderRadius: '12px', border: notif.read ? '1px solid #e2e8f0' : '1.5px solid #007A83',
                        backgroundColor: notif.read ? '#f8fafc' : '#f0fdfa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{notif.title}</strong>
                            {!notif.read && (
                              <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#007A83', color: '#ffffff' }}>
                                NEW
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{notif.message}</p>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {!notif.read && (
                          <button
                            onClick={async () => {
                              try {
                                await doctorService.markNotificationRead(notif.id);
                                await loadNotifications();
                              } catch (err) {
                                console.error('Failed to mark read:', err.message);
                              }
                            }}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.75rem', cursor: 'pointer', color: '#004449', fontWeight: '600' }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
