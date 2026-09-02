import React, { useEffect, useState } from 'react';
import { patientService } from '../../services/patientService';
import PatientCardsPage from './PatientCardsPage';

export default function PatientProfilePage() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    patientService.profile()
      .then((r) => {
        const p = r.data?.data || r.data || null;
        setForm(p);
      })
      .catch((e) => setMessage(e.message));
  }, []);

  if (!form) {
    return (
      <section className="patient-panel">
        <p>{message || 'Loading profile…'}</p>
      </section>
    );
  }

  const save = async (event) => {
    event.preventDefault();
    try {
      const required = ['phone', 'address', 'city', 'region'];
      const payload = Object.fromEntries(required.map((key) => [key, form[key] || '']));
      payload.emergencyContactName = form.emergencyContactName || null;
      payload.emergencyContactPhone = form.emergencyContactPhone || null;
      const response = await patientService.updateProfile(payload);
      setForm(response.data?.data || response.data || payload);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <>
      <section className="patient-panel">
        <h2>My Profile</h2>
        {message && <p role="status" className="patient-error" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{message}</p>}
        <form className="patient-form" onSubmit={save}>
          <div className="profile-name">
            <strong>{form.firstName} {form.lastName}</strong>
            <span>{form.user?.email || form.email}</span>
          </div>
          {['phone', 'address', 'city', 'region', 'emergencyContactName', 'emergencyContactPhone'].map((key) => (
            <label key={key}>
              {key.replace(/([A-Z])/g, ' $1')}
              <input
                required={['phone', 'address', 'city', 'region'].includes(key)}
                value={form[key] || ''}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </label>
          ))}
          <button type="submit">Save Profile</button>
        </form>
      </section>
      <PatientCardsPage />
    </>
  );
}
