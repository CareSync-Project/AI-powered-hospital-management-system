import React, { useEffect, useState } from 'react';
import { vitalService } from '../../services/vitalService';
import VitalSummary from '../../components/nurse/VitalSummary';

export default function PatientVitalsPage() {
  const [items, setItems] = useState([]);
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

  const safeItems = Array.isArray(items)
    ? items.filter((item) => item.source === 'NURSE' && item.verificationStatus === 'VERIFIED')
    : [];

  return (
    <section className="patient-panel">
      <h2>My Clinical Vitals</h2>
      <p>Your verified readings are recorded by the nurse assigned to your appointment and displayed here for your review.</p>
      {message && <p role="status" className="patient-error">{message}</p>}

      <div className="appointment-list" style={{ marginTop: '2rem' }}>
        {safeItems.map((item) => (
          <article className="health-card" key={item.id}>
            <div>
              <strong>{new Date(item.recordedAt).toLocaleString()}</strong>
              <p>
                Recorded and verified by nursing staff
              </p>
              <VitalSummary vital={item} />
            </div>
          </article>
        ))}
      </div>

      {!safeItems.length && (
        <p style={{ color: '#64748b', marginTop: '1rem' }}>No nurse-recorded vital signs are available yet.</p>
      )}
    </section>
  );
}
