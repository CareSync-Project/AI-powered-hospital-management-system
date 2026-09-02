import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, Clock, PlusCircle, Search, Calendar, User, 
  MapPin, FileText, CheckCircle2, AlertCircle, XCircle, RotateCcw, 
  ChevronRight, X, Stethoscope, AlertTriangle
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import { consultationService } from '../../services/consultationService';
import StatusBadge from '../../components/patient/StatusBadge';

const fmt = (value) => value ? new Date(value).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '';
const clock = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';

export default function AppointmentsPage({ refreshKey = 0, onNavigate }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    appointmentService.list()
      .then((r) => {
        const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
        setItems(list);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, [refreshKey]);

  const details = async (item) => {
    setSelected(item);
    setSummary(null);
    if (item.status === 'COMPLETED') {
      try {
        const res = await consultationService.patientSummary(item.id);
        setSummary(res.data?.data || res.data || null);
      } catch (e) {
        // summary is optional if no consultation note exists yet
      }
    }
  };

  const cancel = async (item) => {
    if (!window.confirm(`Are you sure you want to cancel appointment ${item.appointmentNumber}?`)) return;
    try {
      await appointmentService.cancel(item.id, undefined);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const findSlots = async () => {
    if (!newDate || !rescheduling?.department?.id) return;
    setBusy(true);
    try {
      const response = await patientService.doctors(rescheduling.department.id, newDate);
      const docs = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response?.data?.data || []));
      setSlots(docs.flatMap((doctor) => (doctor.appointmentSlots || []).map((slot) => ({ ...slot, doctor }))));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const chooseSlot = async (slot) => {
    setBusy(true);
    try {
      await appointmentService.reschedule(rescheduling.id, slot.id);
      setRescheduling(null);
      setSlots([]);
      setNewDate('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const safeList = Array.isArray(items) ? items : [];

  // Metrics calculation
  const upcomingCount = safeList.filter((x) => !['CANCELLED', 'COMPLETED', 'MISSED'].includes(x.status)).length;
  const completedCount = safeList.filter((x) => x.status === 'COMPLETED').length;
  const missedCount = safeList.filter((x) => x.status === 'MISSED' || (x.status === 'PENDING' && new Date(x.appointmentDate) < new Date().setHours(0, 0, 0, 0))).length;
  const cancelledCount = safeList.filter((x) => x.status === 'CANCELLED').length;

  // Filtered list
  const filteredItems = safeList.filter((item) => {
    const isPastDate = new Date(item.appointmentDate) < new Date().setHours(0, 0, 0, 0);

    let matchesFilter = true;
    if (filter === 'upcoming') {
      matchesFilter = !['CANCELLED', 'COMPLETED', 'MISSED'].includes(item.status) && !isPastDate;
    } else if (filter === 'completed') {
      matchesFilter = item.status === 'COMPLETED';
    } else if (filter === 'missed') {
      matchesFilter = item.status === 'MISSED' || (isPastDate && !['COMPLETED', 'CANCELLED'].includes(item.status));
    } else if (filter === 'cancelled') {
      matchesFilter = item.status === 'CANCELLED';
    }

    if (!matchesFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const numMatch = (item.appointmentNumber || '').toLowerCase().includes(q);
      const docMatch = `${item.doctor?.firstName || ''} ${item.doctor?.lastName || ''}`.toLowerCase().includes(q);
      const deptMatch = (item.department?.name || '').toLowerCase().includes(q);
      const reasonMatch = (item.reasonForVisit || '').toLowerCase().includes(q);
      return numMatch || docMatch || deptMatch || reasonMatch;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header with KPI Counters & New Booking Button */}
      <div style={{
        padding: '1.5rem 2rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 2px 8px rgba(0, 68, 73, 0.04)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#004449', margin: 0 }}>
            Appointments & Clinic Schedule
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Track your scheduled visits, review consultation summaries, and reschedule bookings.
          </p>
        </div>

        <button
          onClick={() => onNavigate?.('book')}
          style={{
            padding: '0.75rem 1.4rem',
            background: 'linear-gradient(135deg, #004449, #007A83)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 68, 73, 0.2)'
          }}
        >
          <PlusCircle size={18} /> Schedule New Appointment
        </button>
      </div>

      {/* KPI Counters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div
          onClick={() => setFilter('upcoming')}
          style={{
            padding: '1.1rem 1.4rem',
            backgroundColor: filter === 'upcoming' ? '#f0fdfa' : '#ffffff',
            border: filter === 'upcoming' ? '2px solid #007A83' : '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#004449' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Scheduled / Upcoming</span>
            <CalendarDays size={18} color="#007A83" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#004449', marginTop: '0.35rem' }}>
            {upcomingCount}
          </div>
        </div>

        <div
          onClick={() => setFilter('completed')}
          style={{
            padding: '1.1rem 1.4rem',
            backgroundColor: filter === 'completed' ? '#ecfdf5' : '#ffffff',
            border: filter === 'completed' ? '2px solid #10b981' : '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#047857' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Completed Visits</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#047857', marginTop: '0.35rem' }}>
            {completedCount}
          </div>
        </div>

        <div
          onClick={() => setFilter('missed')}
          style={{
            padding: '1.1rem 1.4rem',
            backgroundColor: filter === 'missed' ? '#fef2f2' : '#ffffff',
            border: filter === 'missed' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#b91c1c' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Missed Appointments</span>
            <AlertCircle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b91c1c', marginTop: '0.35rem' }}>
            {missedCount}
          </div>
        </div>

        <div
          onClick={() => setFilter('cancelled')}
          style={{
            padding: '1.1rem 1.4rem',
            backgroundColor: filter === 'cancelled' ? '#f8fafc' : '#ffffff',
            border: filter === 'cancelled' ? '2px solid #94a3b8' : '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Cancelled</span>
            <XCircle size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#64748b', marginTop: '0.35rem' }}>
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            ['upcoming', `Scheduled (${upcomingCount})`],
            ['completed', `Completed (${completedCount})`],
            ['missed', `Missed (${missedCount})`],
            ['cancelled', `Cancelled (${cancelledCount})`],
            ['all', `All (${safeList.length})`]
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: filter === key ? '1.5px solid #004449' : '1px solid #e2e8f0',
                backgroundColor: filter === key ? '#004449' : '#f8fafc',
                color: filter === key ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: filter === key ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.45rem 0.85rem', width: 'min(300px, 100%)' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor, dept, number..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              color: '#0f172a',
              width: '100%'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600' }}>
          {error}
        </div>
      )}

      {/* Appointment Cards Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.map((item) => {
          const isScheduled = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING'].includes(item.status);
          const isCompleted = item.status === 'COMPLETED';
          const isMissed = item.status === 'MISSED' || (new Date(item.appointmentDate) < new Date().setHours(0,0,0,0) && isScheduled);

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
                boxShadow: '0 2px 8px rgba(0, 68, 73, 0.03)',
                borderLeft: isCompleted ? '5px solid #10b981' : isMissed ? '5px solid #ef4444' : isScheduled ? '5px solid #007A83' : '5px solid #cbd5e1'
              }}
            >
              {/* Left Details */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdfa',
                  color: '#004449',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Stethoscope size={24} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={isMissed && item.status !== 'MISSED' ? 'MISSED' : item.status} />
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                      #{item.appointmentNumber}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                    {item.department?.name || 'Clinic Department'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#004449', fontWeight: '600', fontSize: '0.9rem' }}>
                    <User size={15} />
                    Dr. {item.doctor?.firstName} {item.doctor?.lastName} {item.doctor?.specialization ? `(${item.doctor.specialization})` : ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.82rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="#007A83" /> {fmt(item.appointmentDate)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} color="#007A83" /> {clock(item.startTime)} – {clock(item.endTime)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} color="#007A83" /> CareSync Main Hospital
                    </span>
                  </div>

                  {item.reasonForVisit && (
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.45rem', backgroundColor: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'inline-block' }}>
                      <strong>Reason:</strong> {item.reasonForVisit}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => details(item)}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#f1f5f9',
                    color: '#004449',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <FileText size={15} /> Details {isCompleted && '& Summary'}
                </button>

                {isScheduled && !isMissed && (
                  <>
                    <button
                      onClick={() => { setRescheduling(item); setSlots([]); setNewDate(''); }}
                      style={{
                        padding: '0.55rem 1rem',
                        backgroundColor: '#004449',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => cancel(item)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #fecdd3',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {(isCompleted || isMissed || item.status === 'CANCELLED') && (
                  <button
                    onClick={() => onNavigate?.('book')}
                    style={{
                      padding: '0.55rem 1rem',
                      backgroundColor: '#007A83',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <RotateCcw size={14} /> Book Again
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!filteredItems.length && (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            color: '#64748b'
          }}>
            <CalendarDays size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              No appointments found
            </h4>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {search ? 'Try clearing your search query.' : `You have no ${filter === 'all' ? '' : filter} appointments on record.`}
            </p>
            <button
              onClick={() => onNavigate?.('book')}
              style={{
                marginTop: '1.25rem',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#004449',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + Schedule an Appointment
            </button>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduling && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#004449', margin: 0 }}>
                Reschedule #{rescheduling.appointmentNumber}
              </h3>
              <button onClick={() => setRescheduling(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              Current booking: <b>{fmt(rescheduling.appointmentDate)} at {clock(rescheduling.startTime)}</b> with Dr. {rescheduling.doctor?.firstName} {rescheduling.doctor?.lastName} ({rescheduling.department?.name}).
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
              Choose new eligible clinic date
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </label>

            <button
              disabled={!newDate || busy}
              onClick={findSlots}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: !newDate || busy ? '#94a3b8' : '#004449',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: !newDate || busy ? 'not-allowed' : 'pointer'
              }}
            >
              {busy ? 'Finding available doctors...' : 'Find Available Doctors & Time Slots'}
            </button>

            {slots.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#004449', marginBottom: '0.65rem' }}>
                  Available Time Slots on {newDate}:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      disabled={busy}
                      onClick={() => chooseSlot(slot)}
                      style={{
                        padding: '0.85rem',
                        backgroundColor: '#f0fdfa',
                        border: '1.5px solid #99f6e4',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <strong style={{ color: '#004449', fontSize: '0.875rem' }}>
                        Dr. {slot.doctor?.firstName} {slot.doctor?.lastName}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#007A83', fontWeight: '600' }}>
                        ⏰ {clock(slot.startTime)} – {clock(slot.endTime)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {newDate && !slots.length && !busy && (
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1rem', textAlign: 'center' }}>
                No active doctor slots found on this date. Please try selecting another clinic date.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Appointment Details & Clinical Summary Modal */}
      {selected && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            maxWidth: '620px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#004449', margin: 0 }}>
                  Appointment Details
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>#{selected.appointmentNumber}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Status</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Hospital & Dept</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>
                  CareSync Hospital · {selected.department?.name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Attending Clinician</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#004449', marginTop: '0.2rem' }}>
                  Dr. {selected.doctor?.firstName} {selected.doctor?.lastName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Date & Scheduled Slot</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '600', color: '#0f172a', marginTop: '0.2rem' }}>
                  {fmt(selected.appointmentDate)} · {clock(selected.startTime)} – {clock(selected.endTime)}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reason for Visit</div>
              <div style={{ fontSize: '0.9rem', color: '#0f172a', marginTop: '0.25rem' }}>
                {selected.reasonForVisit || 'General Clinical Consultation'}
              </div>
              {selected.symptomsSummary && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem' }}>
                  <strong>Reported Symptoms:</strong> {selected.symptomsSummary}
                </div>
              )}
            </div>

            {/* Doctor Consultation Summary (if appointment is completed) */}
            {summary && (
              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: '800', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} /> Official Doctor Consultation Summary
                </div>
                <div style={{ fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  <b>Clinical Diagnosis:</b> {summary.diagnosis || 'Clinical evaluation completed.'}
                </div>
                {summary.treatmentPlan && (
                  <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                    <b>Treatment & Follow-up Plan:</b> {summary.treatmentPlan}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#004449',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
