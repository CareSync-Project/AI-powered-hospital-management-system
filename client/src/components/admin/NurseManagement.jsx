import { useEffect, useState } from 'react';
import { nurseManagementService } from '../../services/nurseManagementService';

const initialForm = { firstName: '', lastName: '', email: '', password: '', phone: '', employeeNumber: '', licenseNumber: '' };

export default function NurseManagement() {
  const [nurses, setNurses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => setNurses((await nurseManagementService.list()).data);
  useEffect(() => { load().catch((error) => setFeedback(error.message)); }, []);

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setFeedback('');
    try {
      await nurseManagementService.create(form);
      setForm(initialForm);
      setFeedback('Nurse account created. The nurse should change the initial password after signing in.');
      await load();
    } catch (error) {
      const details = error.details?.map((item) => item.message).join('. ');
      setFeedback(details || error.message);
    } finally { setBusy(false); }
  };

  return <div style={{ display: 'grid', gap: '1.5rem' }}>
    <section className="glass-panel" style={{ padding: '2rem' }}>
      <h3>Add Nurse</h3>
      <p style={{ color: 'var(--color-text-muted)' }}>The account will automatically belong to your hospital.</p>
      {feedback && <p>{feedback}</p>}
      <form className="management-form-grid" onSubmit={submit}>
        {Object.keys(initialForm).map((key) => <input required key={key} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} className="input-field" placeholder={key.replace(/([A-Z])/g, ' $1')} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}
        <button disabled={busy} className="btn btn-primary">{busy ? 'Creating…' : 'Create nurse'}</button>
      </form>
    </section>
    <section className="glass-panel" style={{ padding: '2rem' }}>
      <h3>Hospital Nurses</h3>
      {nurses.length === 0 ? <p>No nurses assigned.</p> : nurses.map((nurse) => <div key={nurse.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}><strong>{nurse.firstName} {nurse.lastName}</strong><div>{nurse.user.email} · {nurse.active && nurse.user.active ? 'Active' : 'Inactive'}</div><small>Employee: {nurse.employeeNumber} · Licence: {nurse.licenseNumber}</small></div>)}
    </section>
  </div>;
}
