import React, { useEffect, useState } from 'react';
import { vitalService } from '../../services/vitalService';
import VitalSummary from '../../components/nurse/VitalSummary';

const fields = [
  ['temperature', 'Temperature °C'],
  ['systolicBP', 'Systolic BP mmHg'],
  ['diastolicBP', 'Diastolic BP mmHg'],
  ['heartRate', 'Heart rate bpm'],
  ['oxygenSaturation', 'SpO2 %'],
  ['respiratoryRate', 'Respiratory rate breaths/min'],
  ['weight', 'Weight kg'],
  ['height', 'Height cm'],
  ['bloodGlucose', 'Blood glucose mmol/L']
];

export default function PatientVitalsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');

  const load = () => {
    vitalService.mine()
      .then((r) => {
        const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
        setItems(list);
      })
      .catch((e) => setMessage(e.message));
  };

  useEffect(load, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!navigator.onLine) return setMessage('Vital submission requires a secure network connection.');
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== '').map(([key, value]) => [key, Number(value)])
      );
      await vitalService.submitPatient(payload);
      setMessage('Preliminary vital record saved as patient-entered and unverified.');
      setForm({});
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="patient-panel">
      <h2>My Clinical Vitals</h2>
      <p>Readings are recorded for CareSync Hospital. Patient-entered values remain unverified unless a clinician explicitly reviews them.</p>
      {message && <p role="status" className="patient-error" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{message}</p>}

      <form className="patient-form vital-grid" onSubmit={submit}>
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              step="any"
              value={form[key] ?? ''}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </label>
        ))}
        <button type="submit">Save Preliminary Vitals</button>
      </form>

      <div className="appointment-list" style={{ marginTop: '2rem' }}>
        {safeItems.map((item) => (
          <article className="health-card" key={item.id}>
            <div>
              <strong>{new Date(item.recordedAt).toLocaleString()}</strong>
              <p>
                {item.source === 'PATIENT'
                  ? 'Patient-entered — not clinically verified unless marked verified'
                  : `${item.source} recorded`}
              </p>
              <VitalSummary vital={item} />
            </div>
          </article>
        ))}
      </div>

      {!safeItems.length && (
        <p style={{ color: '#64748b', marginTop: '1rem' }}>No vital records recorded yet.</p>
      )}
    </section>
  );
}
