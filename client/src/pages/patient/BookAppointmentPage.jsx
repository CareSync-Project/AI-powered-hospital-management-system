import React, { useEffect, useMemo, useState } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import { Calendar, Clock, User, Stethoscope, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

const STEPS = ['Department', 'Date', 'Doctor & Time', 'Visit Details', 'Confirmation'];
const DAY_INDEX = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';

export default function BookAppointmentPage({ onBooked, initialSelection }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    reasonForVisit: '',
    symptomsSummary: '',
    departmentId: initialSelection?.departmentId || '',
    symptomAssessmentId: initialSelection?.assessmentId || null,
    date: '',
    slotId: ''
  });
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    patientService.departments()
      .then((response) => {
        const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response?.data?.data || []));
        setDepartments(list);
        setHospital(response?.hospital || null);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (data.departmentId && data.date) {
      patientService.doctors(data.departmentId, data.date)
        .then((r) => {
          const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
          setDoctors(list);
        })
        .catch((e) => setError(e.message));
    }
  }, [data.departmentId, data.date]);

  const safeDepts = Array.isArray(departments) ? departments : [];
  const safeDocs = Array.isArray(doctors) ? doctors : [];

  const department = safeDepts.find((item) => item.id === data.departmentId);
  const slot = safeDocs
    .flatMap((doctor) => (doctor.appointmentSlots || []).map((item) => ({ ...item, doctor })))
    .find((item) => item.id === data.slotId);

  const validDays = useMemo(
    () => new Set((department?.schedules || []).map((schedule) => DAY_INDEX[schedule.dayOfWeek])),
    [department]
  );

  const canContinue = [
    Boolean(data.departmentId),
    Boolean(data.date && validDays.has(new Date(`${data.date}T12:00:00`).getDay())),
    Boolean(data.slotId),
    Boolean(data.reasonForVisit.trim().length >= 3),
    true
  ][step];

  const choose = (values) => {
    setData((old) => ({ ...old, ...values }));
    setError('');
  };

  const recommend = async () => {
    setBusy(true);
    try {
      const response = await patientService.recommendation(data.departmentId, data.date);
      const resSlot = response.data?.recommendedSlot || response.recommendedSlot;
      if (resSlot) choose({ slotId: resSlot.id });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!navigator.onLine) return setError('Booking requires an internet connection. Nothing was submitted.');
    setBusy(true);
    try {
      const response = await appointmentService.book({
        slotId: data.slotId,
        symptomAssessmentId: data.symptomAssessmentId || null,
        reasonForVisit: data.reasonForVisit,
        symptomsSummary: data.symptomsSummary || null
      });
      setConfirmed(response.data?.data || response.data);
      onBooked?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const errMessage = (e) => e.response?.data?.message || e.message || 'Failed to complete appointment booking.';

  if (confirmed) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '2.5rem',
        textAlign: 'center',
        maxWidth: '580px',
        margin: '2rem auto',
        boxShadow: '0 4px 20px rgba(0, 68, 73, 0.06)'
      }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <CheckCircle2 size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#004449', margin: '0 0 0.25rem 0' }}>
          Appointment Confirmed!
        </h2>
        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#007A83', margin: '0.5rem 0' }}>
          #{confirmed.appointmentNumber}
        </div>
        <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          CareSync Hospital · {confirmed.department?.name}<br />
          Dr. {confirmed.doctor?.firstName} {confirmed.doctor?.lastName}<br />
          {new Date(confirmed.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {time(confirmed.startTime)}
        </p>
        <button
          onClick={() => onBooked?.('appointments')}
          style={{
            padding: '0.75rem 1.75rem',
            backgroundColor: '#004449',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 68, 73, 0.2)'
          }}
        >
          View in My Appointments →
        </button>
      </div>
    );
  }

  return (
    <section className="patient-panel booking-page" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#004449', margin: '0 0 0.25rem 0' }}>
        Book a Clinical Appointment
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
        CareSync Hospital · Select a department, doctor, and convenient time slot.
      </p>

      {/* Stepper Bar */}
      <ol className="booking-steps" style={{ marginBottom: '2rem' }}>
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Step 0: Department Selection */}
      {step === 0 && (
        <div className="choice-grid">
          {safeDepts.map((item) => (
            <button
              key={item.id}
              className={data.departmentId === item.id ? 'selected' : ''}
              onClick={() => choose({ departmentId: item.id, date: '', slotId: '' })}
            >
              <strong>{item.name}</strong>
              <small>{item.description}</small>
              <small>
                {(item.schedules || [])
                  .map((schedule) => `${schedule.dayOfWeek} ${time(schedule.startTime)}–${time(schedule.endTime)}`)
                  .join(' · ') || 'Clinic hours available'}
              </small>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Date Selection */}
      {step === 1 && (
        <div>
          <label htmlFor="appointment-date" style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            Choose Clinic Date
          </label>
          <input
            id="appointment-date"
            type="date"
            min={today}
            max={maxDate}
            value={data.date || ''}
            onChange={(event) => choose({ date: event.target.value, slotId: '' })}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.95rem',
              outline: 'none',
              maxWidth: '320px',
              width: '100%'
            }}
          />
          {data.date && !canContinue && (
            <p className="patient-error" style={{ marginTop: '0.75rem' }}>
              This department does not operate on the selected day of the week.
            </p>
          )}
          <p className="patient-help" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            Appointments can be scheduled up to 60 days in advance.
          </p>
        </div>
      )}

      {/* Step 2: Doctor & Slot Selection */}
      {step === 2 && (
        <div>
          <button
            disabled={busy}
            onClick={recommend}
            style={{
              marginBottom: '1.25rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#f0fdfa',
              border: '1.5px solid #007A83',
              color: '#004449',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {busy ? 'Calculating...' : '⚡ Recommend earliest available doctor slot'}
          </button>
          <div className="slot-list">
            {safeDocs.flatMap((doctor) =>
              (doctor.appointmentSlots || []).map((item) => (
                <button
                  key={item.id}
                  className={data.slotId === item.id ? 'selected' : ''}
                  onClick={() => choose({ slotId: item.id })}
                >
                  <strong>Dr. {doctor.firstName} {doctor.lastName}</strong>
                  <span>{time(item.startTime)}–{time(item.endTime)}</span>
                  <small>{doctor.specialization} · {(item.capacity || 20) - (item.bookedCount || 0)} place(s) available</small>
                </button>
              ))
            )}
          </div>
          {!safeDocs.length && (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              No active doctor slots are scheduled for this date.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Visit Details */}
      {step === 3 && (
        <div className="form-stack">
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontWeight: '700', fontSize: '0.875rem' }}>
            Primary Reason for Visit *
            <textarea
              value={data.reasonForVisit}
              maxLength={1000}
              onChange={(event) => choose({ reasonForVisit: event.target.value })}
              required
              placeholder="e.g. Regular medical follow-up, persistent cough, routine health check..."
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', minHeight: '80px', outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontWeight: '700', fontSize: '0.875rem', marginTop: '1rem' }}>
            Symptoms or Additional Complaints (optional)
            <textarea
              value={data.symptomsSummary}
              maxLength={2000}
              onChange={(event) => choose({ symptomsSummary: event.target.value })}
              placeholder="Describe any specific symptoms or health context for the doctor..."
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', minHeight: '80px', outline: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Step 4: Final Confirmation */}
      {step === 4 && (
        <div className="booking-summary" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#004449', margin: '0 0 1rem 0' }}>
            Review Appointment Booking
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Hospital & Dept</span>
              <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>CareSync Hospital · {department?.name}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Doctor</span>
              <div style={{ fontWeight: '700', color: '#004449', marginTop: '0.2rem' }}>Dr. {slot?.doctor?.firstName} {slot?.doctor?.lastName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Date & Slot</span>
              <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>{data.date} at {slot && time(slot.startTime)}</div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Reason for Visit</span>
            <p style={{ margin: '0.25rem 0 0 0', color: '#334155' }}>{data.reasonForVisit}</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="wizard-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        {step > 0 ? (
          <button className="secondary" disabled={busy} onClick={() => setStep(step - 1)} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}>
            ← Back
          </button>
        ) : <div />}
        
        {step < 4 ? (
          <button
            disabled={!canContinue || busy}
            onClick={() => setStep(step + 1)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: !canContinue || busy ? '#94a3b8' : '#004449',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: !canContinue || busy ? 'not-allowed' : 'pointer'
            }}
          >
            Continue →
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={confirm}
            style={{
              padding: '0.75rem 1.75rem',
              background: 'linear-gradient(135deg, #004449, #007A83)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: busy ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0, 68, 73, 0.2)'
            }}
          >
            {busy ? 'Booking…' : 'Confirm & Schedule Appointment'}
          </button>
        )}
      </div>
    </section>
  );
}
