import React, { useEffect, useState } from 'react';
import { Activity, Bell, Brain, CalendarDays, HeartPulse, Home, LogOut, PlusCircle, UserRound, ChevronRight, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MobileBottomNavigation from '../components/patient/MobileBottomNavigation';
import OfflineBanner from '../components/patient/OfflineBanner';
import InstallPwaPrompt from '../components/patient/InstallPwaPrompt';
import CareAssistant from '../components/patient/CareAssistant';
import BookAppointmentPage from './patient/BookAppointmentPage';
import AppointmentsPage from './patient/AppointmentsPage';
import NotificationsPage from './patient/NotificationsPage';
import PatientProfilePage from './patient/PatientProfilePage';
import PatientVitalsPage from './patient/PatientVitalsPage';
import SymptomAssessmentPage from './patient/SymptomAssessmentPage';

const NAV = [
  ['home',          Home,          'Home Overview'],
  ['symptoms',      Brain,         'AI Symptom Check'],
  ['book',          PlusCircle,    'Book Appointment'],
  ['appointments',  CalendarDays,  'My Appointments'],
  ['vitals',        Activity,      'My Vitals'],
  ['notifications', Bell,          'Notifications'],
  ['profile',       UserRound,     'My Profile']
];

function PatientHome({ user, onSelect, refreshKey }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    appointmentService.list().then(r => setAppointments(r.data || [])).catch(() => {});
  }, [refreshKey]);

  const upcomingAppts = appointments.filter(x => !['CANCELLED', 'COMPLETED', 'MISSED'].includes(x.status));
  const nextAppt = upcomingAppts[0];
  const completedCount = appointments.filter(x => x.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Patient Welcome Hero Card */}
      <div style={{
        padding: '2rem 2.25rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #00383c, #005a60, #007a83)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 68, 73, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            <HeartPulse size={18} /> CareSync Patient Portal
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.4rem 0 0.25rem 0', color: '#ffffff' }}>
            Welcome back, {user?.profile?.firstName || user?.firstName || 'Patient'}!
          </h2>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem', maxWidth: '480px' }}>
            Access personalized AI symptom triage, schedule hospital appointments, and review your clinical vitals and consultation summaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelect('book')}
            style={{
              padding: '0.75rem 1.4rem', backgroundColor: '#ffffff', color: '#004449', border: 'none',
              borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <PlusCircle size={18} /> Book Appointment
          </button>
          <button
            onClick={() => onSelect('symptoms')}
            style={{
              padding: '0.75rem 1.4rem', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '700',
              fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Brain size={18} /> AI Symptom Check
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Next Appointment Card */}
        <div
          onClick={() => onSelect('appointments')}
          style={{
            padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Next Appointment</span>
            <CalendarDays size={18} color="#004449" />
          </div>
          {nextAppt ? (
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                {nextAppt.department?.name || 'Consultation'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#005a60', marginTop: '0.25rem', fontWeight: '600' }}>
                Dr. {nextAppt.doctor?.firstName} {nextAppt.doctor?.lastName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                📅 {new Date(nextAppt.appointmentDate).toLocaleDateString()} at {new Date(nextAppt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
              </div>
              <div style={{ marginTop: '0.65rem' }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '999px',
                  backgroundColor: nextAppt.status === 'CONFIRMED' ? '#e0f2fe' : '#ffedd5',
                  color: nextAppt.status === 'CONFIRMED' ? '#0369a1' : '#c2410c'
                }}>
                  {nextAppt.status.replaceAll('_', ' ')}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8' }}>No upcoming bookings</div>
              <div style={{ fontSize: '0.78rem', color: '#007A83', marginTop: '0.35rem', fontWeight: '600' }}>Click to schedule now →</div>
            </div>
          )}
        </div>

        {/* AI Symptom Check KPI */}
        <div
          onClick={() => onSelect('symptoms')}
          style={{
            padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Clinical AI Triage</span>
            <Sparkles size={18} color="#004449" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#004449' }}>
            AI Health Assistant
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Check symptoms, triage emergency safety, and match clinic departments
          </div>
        </div>

        {/* Clinical Vitals Shortcut */}
        <div
          onClick={() => onSelect('vitals')}
          style={{
            padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Clinical Records</span>
            <Activity size={18} color="#004449" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
            My Clinical Vitals
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Record self-reported health readings for hospital review
          </div>
        </div>
      </div>

      {/* Quick Access Feature Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#004449', fontWeight: '700', marginBottom: '0.35rem' }}>
              <Brain size={20} /> AI-Assisted Pre-Visit Triage
            </div>
            <p style={{ fontSize: '0.85rem', color: '#005a60', margin: 0, lineHeight: 1.5 }}>
              Experiencing symptoms? Complete our AI symptom check for emergency safety screening and automated department recommendation.
            </p>
          </div>
          <button
            onClick={() => onSelect('symptoms')}
            style={{
              marginTop: '1rem', padding: '0.55rem 1.1rem', backgroundColor: '#004449', color: '#ffffff',
              border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            Start Assessment <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: '700', marginBottom: '0.35rem' }}>
              <CalendarDays size={20} color="#004449" /> Consultations & Follow-ups
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Review your past clinical diagnoses, treatment summaries, and doctor prescription notes in the appointments history.
            </p>
          </div>
          <button
            onClick={() => onSelect('appointments')}
            style={{
              marginTop: '1rem', padding: '0.55rem 1.1rem', backgroundColor: '#f1f5f9', color: '#0f172a',
              border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            View History ({completedCount} visits) <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const [bookingPrefill, setBookingPrefill] = useState(null);

  // Notifications & Badges State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.list();
      const list = res.data?.data || res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('Patient notifications load error:', err.message);
    }
  };

  const loadBadges = async () => {
    try {
      const r = await appointmentService.list();
      const list = r.data?.data || r.data || [];
      const upcoming = Array.isArray(list) ? list.filter(x => !['CANCELLED', 'COMPLETED', 'MISSED'].includes(x.status)) : [];
      setUpcomingCount(upcoming.length);
    } catch (err) {
      // quiet fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    loadBadges();
    const interval = setInterval(() => {
      loadNotifications();
      loadBadges();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const openBooking = (prefill) => {
    setBookingPrefill(prefill || null);
    setTab('book');
  };

  const booked = () => {
    setRefreshKey((k) => k + 1);
    setBookingPrefill(null);
    setTab('appointments');
  };

  return (
    <div className="patient-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <InstallPwaPrompt />
      <OfflineBanner />

      {/* Left Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#004449',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.75rem 1.25rem',
        boxShadow: '4px 0 20px rgba(0, 68, 73, 0.08)',
        zIndex: 10
      }}>
        <div>
          {/* Hospital Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 1.75rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#007A83',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <HeartPulse size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
                CareSync
              </h1>
              <span style={{ fontSize: '0.7rem', color: '#99f6e4', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '600' }}>
                Patient Portal
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1.5rem' }}>
            {NAV.map(([key, Icon, label]) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} color={isActive ? '#99f6e4' : '#94a3b8'} />
                    <span>{label}</span>
                  </div>

                  {/* Badges for active tabs */}
                  {key === 'appointments' && upcomingCount > 0 && (
                    <span style={{
                      backgroundColor: '#007A83',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px'
                    }}>
                      {upcomingCount}
                    </span>
                  )}

                  {key === 'notifications' && unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Box */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.875rem'
            }}>
              {user?.profile?.firstName?.[0] || user?.firstName?.[0] || 'P'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.profile?.firstName || user?.firstName || 'Patient'} {user?.profile?.lastName || user?.lastName || ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.65rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main style={{
        flex: 1,
        padding: tab === 'symptoms' ? '1.25rem 2rem' : '2rem 3rem',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tab === 'symptoms' ? '1rem' : '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', textTransform: 'capitalize', color: '#0f172a', margin: 0 }}>
              {NAV.find(x => x[0] === tab)?.[2] || 'Patient Portal'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              CareSync Secure Patient Workspace
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Top Header Notification Bell */}
            <button
              onClick={() => setTab('notifications')}
              style={{
                position: 'relative', background: '#f1f5f9', border: '1px solid #cbd5e1',
                padding: '0.55rem', borderRadius: '50%', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#004449'
              }}
              title="Notifications & Announcements"
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
              <HeartPulse size={16} color="#004449" />
              {user?.profile?.firstName || user?.firstName || 'Patient'}
            </div>
          </div>
        </header>

        {/* Tab views wrapped in ErrorBoundary */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary key={tab}>
            {tab === 'home'          && <PatientHome user={user} onSelect={setTab} refreshKey={refreshKey} />}
            {tab === 'symptoms'      && <SymptomAssessmentPage onBook={openBooking} />}
            {tab === 'book'          && <BookAppointmentPage initialSelection={bookingPrefill} onBooked={booked} />}
            {tab === 'appointments'  && <AppointmentsPage refreshKey={refreshKey} onNavigate={setTab} />}
            {tab === 'vitals'        && <PatientVitalsPage />}
            {tab === 'notifications'  && <NotificationsPage />}
            {tab === 'profile'        && <PatientProfilePage />}
          </ErrorBoundary>
        </div>
      </main>

      {tab !== 'symptoms' && <CareAssistant onBook={openBooking} />}
      <MobileBottomNavigation active={tab} onSelect={setTab} />
    </div>
  );
}
