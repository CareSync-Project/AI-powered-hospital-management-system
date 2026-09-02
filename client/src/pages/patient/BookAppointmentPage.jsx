import React, { useEffect, useMemo, useState } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { patientCardService } from '../../services/patientCardService';
import { patientService } from '../../services/patientService';

const STEPS = ['Department', 'Date', 'Doctor & Time', 'Card', 'Visit Details', 'Confirmation'];
const DAY_INDEX = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';

export default function BookAppointmentPage({ onBooked, openCards, initialSelection }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    reasonForVisit: '',
    symptomsSummary: '',
    departmentId: initialSelection?.departmentId || '',
    symptomAssessmentId: initialSelection?.assessmentId || null
  });
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [cards, setCards] = useState([]);
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

    patientCardService.list()
      .then((r) => {
        const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
        setCards(list);
      })
      .catch(() => {});
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
  const safeCards = Array.isArray(cards) ? cards : [];

  const department = safeDepts.find((item) => item.id === data.departmentId);
  const slot = safeDocs
    .flatMap((doctor) => (doctor.appointmentSlots || []).map((item) => ({ ...item, doctor })))
    .find((item) => item.id === data.slotId);
  const card = safeCards.find((item) => item.id === data.patientCardId);

  const validDays = useMemo(
    () => new Set((department?.schedules || []).map((schedule) => DAY_INDEX[schedule.dayOfWeek])),
    [department]
  );

  const canContinue = [
    data.departmentId,
    data.date && validDays.has(new Date(`${data.date}T12:00:00`).getDay()),
    data.slotId,
    data.patientCardId,
    data.reasonForVisit.trim().length >= 3,
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
        patientCardId: data.patientCardId,
        symptomAssessmentId: data.symptomAssessmentId || null,
        reasonForVisit: data.reasonForVisit,
        symptomsSummary: data.symptomsSummary || null
      });
      setConfirmed(response.data?.data || response.data);
      onBooked?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (confirmed) {
    return (
      <section className="patient-panel booking-confirmed">
        <h2>Appointment Confirmed</h2>
        <strong>{confirmed.appointmentNumber}</strong>
        <p>CareSync Hospital · {confirmed.department?.name}</p>
        <p>Dr. {confirmed.doctor?.firstName} {confirmed.doctor?.lastName}</p>
        <p>{new Date(confirmed.appointmentDate).toLocaleDateString()} at {time(confirmed.startTime)}</p>
        <button onClick={() => onBooked?.('appointments')}>Go to My Appointments</button>
      </section>
    );
  }

  return (
    <section className="patient-panel booking-page">
      <h2>Book a CareSync Appointment</h2>
      <p className="patient-help">CareSync Hospital is selected automatically.</p>

      <ol className="booking-steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {error && <p className="patient-error" role="alert">{error}</p>}

      {step === 0 && (
        <div className="choice-grid">
          {safeDepts.map((item) => (
            <button
              key={item.id}
              className={data.departmentId === item.id ? 'selected' : ''}
              onClick={() => choose({ departmentId: item.id, date: '', slotId: '', patientCardId: '' })}
            >
              <strong>{item.name}</strong>
              <small>{item.description}</small>
              <small>
                {(item.schedules || [])
                  .map((schedule) => `${schedule.dayOfWeek} ${time(schedule.startTime)}–${time(schedule.endTime)}`)
                  .join(' · ') || 'No clinic days configured'}
              </small>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div>
          <label htmlFor="appointment-date">Eligible clinic date</label>
          <input
            id="appointment-date"
            type="date"
            min={today}
            max={maxDate}
            value={data.date || ''}
            onChange={(event) => choose({ date: event.target.value, slotId: '' })}
          />
          {data.date && !canContinue && (
            <p className="patient-error" style={{ marginTop: '0.5rem' }}>This department does not operate on the selected day.</p>
          )}
          <p className="patient-help">Dates are available up to 60 days ahead.</p>
        </div>
      )}

      {step === 2 && (
        <div>
          <button disabled={busy} onClick={recommend} style={{ marginBottom: '1rem' }}>
            {busy ? 'Calculating...' : 'Recommend earliest available doctor'}
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
          {!safeDocs.length && <p style={{ color: '#64748b' }}>No appointments are available for this date.</p>}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="choice-grid">
            {safeCards
              .filter((item) => !hospital || item.hospitalId === hospital.id)
              .map((item) => (
                <button
                  key={item.id}
                  disabled={item.verificationStatus !== 'VERIFIED'}
                  className={data.patientCardId === item.id ? 'selected' : ''}
                  onClick={() => choose({ patientCardId: item.id })}
                >
                  <strong>{item.cardType ? item.cardType.replace('_', ' ') : 'Card'}</strong>
                  <span>{item.cardNumber}</span>
                  <small>{item.verificationStatus === 'PENDING' ? 'Pending CareSync verification' : item.verificationStatus}</small>
                </button>
              ))}
          </div>
          {!safeCards.some((item) => item.verificationStatus === 'VERIFIED') && (
            <p style={{ marginTop: '1rem' }}>
              No verified card is available.{' '}
              <button onClick={openCards} style={{ marginLeft: '0.5rem' }}>Add Hospital/NHIS Card</button>
            </p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="form-stack">
          <label>
            Reason for visit
            <textarea
              value={data.reasonForVisit}
              maxLength={1000}
              onChange={(event) => choose({ reasonForVisit: event.target.value })}
              required
              placeholder="e.g. Regular medical checkup, recurring fever..."
            />
          </label>
          <label>
            Brief symptoms or complaint (optional)
            <textarea
              value={data.symptomsSummary}
              maxLength={2000}
              onChange={(event) => choose({ symptomsSummary: event.target.value })}
              placeholder="Describe any specific symptoms..."
            />
          </label>
          <p className="patient-help">This information does not provide a confirmed diagnosis.</p>
        </div>
      )}

      {step === 5 && (
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <p><b>Hospital:</b> CareSync Hospital</p>
          <p><b>Department:</b> {department?.name}</p>
          <p><b>Doctor:</b> Dr. {slot?.doctor?.firstName} {slot?.doctor?.lastName}</p>
          <p><b>Date/Time:</b> {data.date} · {slot && time(slot.startTime)}</p>
          <p><b>Card:</b> {card?.cardType ? card.cardType.replace('_', ' ') : ''} {card?.cardNumber}</p>
          <p><b>Reason:</b> {data.reasonForVisit}</p>
        </div>
      )}

      <div className="wizard-actions">
        {step > 0 && (
          <button className="secondary" disabled={busy} onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 5 ? (
          <button disabled={!canContinue || busy} onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <button disabled={busy} onClick={confirm}>
            {busy ? 'Booking…' : 'Confirm Booking'}
          </button>
        )}
      </div>
    </section>
  );
}
