import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { superAdminService } from '../services/superAdminService';

const blank = { hospitalId: '', firstName: '', lastName: '', email: '', password: '', phone: '', employeeNumber: '' };

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [hospitals, setHospitals] = useState([]); const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(blank); const [feedback, setFeedback] = useState(''); const [busy, setBusy] = useState(false);
  const load = async () => { const [h, a] = await Promise.all([superAdminService.hospitals(), superAdminService.admins()]); setHospitals(h.data); setAdmins(a.data); };
  useEffect(() => { load().catch((error) => setFeedback(error.message)); }, []);
  const create = async (event) => { event.preventDefault(); setBusy(true); setFeedback(''); try { await superAdminService.createAdmin(form); setForm(blank); setFeedback('Hospital administrator created successfully.'); await load(); } catch (error) { setFeedback(error.details?.map((item) => item.message).join('. ') || error.message); } finally { setBusy(false); } };
  const toggle = async (admin) => { if (!window.confirm(`${admin.active ? 'Deactivate' : 'Activate'} ${admin.email}?`)) return; try { await superAdminService.setAdminActive(admin.id, !admin.active); await load(); } catch (error) { setFeedback(error.message); } };
  return <main className="container" style={{ padding: '2rem 0 4rem' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}><div><h1><ShieldCheck size={30} /> System Owner</h1><p>{user.email} · Platform administration</p></div><button className="btn btn-outline" onClick={logout}><LogOut size={16} /> Logout</button></header>
    {feedback && <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>{feedback}</div>}
    <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}><h2>Create Hospital Administrator</h2><p style={{ color: 'var(--color-text-muted)' }}>Only system owners can create hospital administrators. Hospital assignment is enforced by the backend.</p><form className="management-form-grid" onSubmit={create} autoComplete="off"><select required className="input-field" value={form.hospitalId} onChange={(event) => setForm({ ...form, hospitalId: event.target.value })}><option value="">Select hospital</option>{hospitals.filter((hospital) => hospital.active).map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name} ({hospital.hospitalCode})</option>)}</select>{['firstName', 'lastName', 'email', 'password', 'phone', 'employeeNumber'].map((key) => <input required key={key} autoComplete="off" type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} className="input-field" placeholder={key.replace(/([A-Z])/g, ' $1')} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}<button disabled={busy} className="btn btn-primary">{busy ? 'Creating…' : 'Create administrator'}</button></form></section>
    <section className="glass-panel" style={{ padding: '2rem' }}><h2>Hospital Administrators</h2>{admins.length === 0 ? <p>No hospital administrators found.</p> : admins.map((admin) => <article key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}><div><strong>{admin.adminProfile?.firstName} {admin.adminProfile?.lastName}</strong><div>{admin.email}</div><small>{admin.adminProfile?.hospital?.name} · {admin.active ? 'Active' : 'Inactive'}</small></div><button className="btn btn-outline" onClick={() => toggle(admin)}>{admin.active ? 'Deactivate' : 'Activate'}</button></article>)}</section>
  </main>;
}
