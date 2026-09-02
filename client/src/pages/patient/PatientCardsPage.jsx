import React, { useEffect, useState } from 'react';
import { patientCardService } from '../../services/patientCardService';
import StatusBadge from '../../components/patient/StatusBadge';

export default function PatientCardsPage() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ cardType: 'HOSPITAL_CARD', cardNumber: '', expiresAt: '' });

  const load = () => {
    patientCardService.list()
      .then((response) => {
        const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response?.data?.data || []));
        setCards(list);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!navigator.onLine) return setError('Card submission requires an internet connection. Nothing was submitted.');
    try {
      await patientCardService.create({ ...form, expiresAt: form.expiresAt || null });
      setForm({ ...form, cardNumber: '', expiresAt: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const safeCards = Array.isArray(cards) ? cards : [];

  return (
    <section className="patient-panel">
      <h2>My Health Cards</h2>
      <p>CareSync administrators manually verify Hospital and NHIS cards. This is not official NHIA/NHIS database verification.</p>
      {error && <p className="patient-error">{error}</p>}
      
      <div className="card-grid" style={{ marginTop: '1rem' }}>
        {safeCards.map((card) => (
          <article key={card.id} className="health-card">
            <StatusBadge status={card.verificationStatus} />
            <h3>{card.cardType ? card.cardType.replace('_', ' ') : 'Card'}</h3>
            <strong>{card.cardNumber}</strong>
            <p>CareSync Hospital</p>
            {card.expiresAt && <p>Expiry: {new Date(card.expiresAt).toLocaleDateString()}</p>}
            {card.rejectionReason && <p>Reason: {card.rejectionReason}</p>}
          </article>
        ))}
      </div>

      {!safeCards.length && (
        <p style={{ color: '#64748b', marginTop: '1rem' }}>No health cards logged yet. Add your card below.</p>
      )}

      <form className="patient-form" onSubmit={submit} style={{ marginTop: '2rem' }}>
        <h3>Add Hospital or NHIS Card</h3>
        <label>
          Card type
          <select value={form.cardType} onChange={(event) => setForm({ ...form, cardType: event.target.value })}>
            <option value="HOSPITAL_CARD">Hospital Card</option>
            <option value="NHIS_CARD">NHIS Card</option>
          </select>
        </label>
        <label>
          Card number
          <input
            required
            minLength="4"
            maxLength="80"
            autoComplete="off"
            value={form.cardNumber}
            onChange={(event) => setForm({ ...form, cardNumber: event.target.value })}
            placeholder="e.g. HOSP-12345 or NHIS-987654"
          />
        </label>
        <label>
          Expiry date (optional)
          <input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
        </label>
        <button type="submit">Submit for Verification</button>
      </form>
    </section>
  );
}
