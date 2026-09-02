import React, { useEffect, useState } from 'react';
import { patientService } from '../../services/patientService';
import { patientCardService } from '../../services/patientCardService';
import StatusBadge from '../../components/patient/StatusBadge';
import { CreditCard, PlusCircle, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PatientProfilePage() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [cards, setCards] = useState([]);
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState('');
  const [cardForm, setCardForm] = useState({ cardType: 'HOSPITAL_CARD', cardNumber: '', expiresAt: '' });
  const [cardBusy, setCardBusy] = useState(false);

  const loadProfile = () => {
    patientService.profile()
      .then((r) => {
        const p = r.data?.data || r.data || null;
        setForm(p);
      })
      .catch((e) => setMessage(e.message));
  };

  const loadCards = () => {
    patientCardService.list()
      .then((response) => {
        const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (response?.data?.data || []));
        setCards(list);
      })
      .catch((e) => setCardError(e.message));
  };

  useEffect(() => {
    loadProfile();
    loadCards();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const required = ['phone', 'address', 'city', 'region'];
      const payload = Object.fromEntries(required.map((key) => [key, form[key] || '']));
      payload.emergencyContactName = form.emergencyContactName || null;
      payload.emergencyContactPhone = form.emergencyContactPhone || null;
      const response = await patientService.updateProfile(payload);
      setForm(response.data?.data || response.data || payload);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submitCard = async (event) => {
    event.preventDefault();
    setCardError('');
    setCardSuccess('');
    if (!navigator.onLine) return setCardError('Card submission requires an internet connection.');
    setCardBusy(true);
    try {
      await patientCardService.create({ ...cardForm, expiresAt: cardForm.expiresAt || null });
      setCardForm({ cardType: 'HOSPITAL_CARD', cardNumber: '', expiresAt: '' });
      setCardSuccess('Health card submitted for verification.');
      loadCards();
      setTimeout(() => setCardSuccess(''), 4000);
    } catch (e) {
      setCardError(e.response?.data?.message || e.message);
    } finally {
      setCardBusy(false);
    }
  };

  if (!form) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>{message || 'Loading patient profile…'}</p>
      </div>
    );
  }

  const safeCards = Array.isArray(cards) ? cards : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Profile & Demographics Card */}
      <section style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 8px rgba(0, 68, 73, 0.04)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#004449', margin: '0 0 0.25rem 0' }}>
          Personal Profile & Contact Info
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
          Keep your residential address, active phone number, and emergency contact details up to date.
        </p>

        {message && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.25rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={saveProfile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#004449', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
              {form.firstName?.[0] || 'P'}
            </div>
            <div>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>{form.firstName} {form.lastName}</strong>
              <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '0.15rem' }}>{form.user?.email || form.email}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Phone Number *
              <input
                required
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Street Address *
              <input
                required
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              City *
              <input
                required
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Region *
              <input
                required
                value={form.region || ''}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Emergency Contact Name
              <input
                value={form.emergencyContactName || ''}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                placeholder="Next of kin / guardian"
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Emergency Contact Phone
              <input
                value={form.emergencyContactPhone || ''}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                placeholder="e.g. +233 24 123 4567"
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '1.5rem',
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
            Save Profile Changes
          </button>
        </form>
      </section>

      {/* Hospital & NHIS Cards Management Section */}
      <section style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 8px rgba(0, 68, 73, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#004449', margin: '0 0 0.25rem 0' }}>
              Hospital & NHIS Health Cards
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              Registered health insurance and hospital identity cards for clinical verification.
            </p>
          </div>
        </div>

        {cardSuccess && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.25rem' }}>
            {cardSuccess}
          </div>
        )}

        {cardError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.25rem' }}>
            {cardError}
          </div>
        )}

        {/* Existing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {safeCards.map((card) => (
            <div
              key={card.id}
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1.5px solid #e2e8f0',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#007A83', fontWeight: '700', textTransform: 'uppercase' }}>
                    {card.cardType ? card.cardType.replace('_', ' ') : 'Card'}
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a', letterSpacing: '0.04em', display: 'block', marginTop: '0.2rem' }}>
                    {card.cardNumber}
                  </strong>
                </div>
                <StatusBadge status={card.verificationStatus} />
              </div>

              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                <div>CareSync Hospital System</div>
                {card.expiresAt && (
                  <div>Expires: {new Date(card.expiresAt).toLocaleDateString()}</div>
                )}
                {card.rejectionReason && (
                  <div style={{ color: '#dc2626', marginTop: '0.25rem' }}>Reason: {card.rejectionReason}</div>
                )}
              </div>
            </div>
          ))}

          {!safeCards.length && (
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.875rem' }}>
              No health cards logged yet. Add your NHIS or hospital card below for verification.
            </div>
          )}
        </div>

        {/* Add Card Form */}
        <form onSubmit={submitCard} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#004449', margin: '0 0 1rem 0' }}>
            + Link a New Health / NHIS Card
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Card Type
              <select
                value={cardForm.cardType}
                onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', outline: 'none' }}
              >
                <option value="HOSPITAL_CARD">Hospital Card</option>
                <option value="NHIS_CARD">NHIS Card</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Card Number *
              <input
                required
                minLength={4}
                maxLength={80}
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                placeholder="e.g. HOSP-10293 or NHIS-829103"
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Expiry Date (optional)
              <input
                type="date"
                value={cardForm.expiresAt}
                onChange={(e) => setCardForm({ ...cardForm, expiresAt: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={cardBusy}
            style={{
              marginTop: '1.25rem',
              padding: '0.65rem 1.5rem',
              backgroundColor: cardBusy ? '#94a3b8' : '#007A83',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: cardBusy ? 'not-allowed' : 'pointer'
            }}
          >
            {cardBusy ? 'Submitting...' : 'Submit Card for Verification'}
          </button>
        </form>
      </section>
    </div>
  );
}
