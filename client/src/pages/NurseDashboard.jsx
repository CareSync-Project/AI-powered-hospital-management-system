import { useAuth } from '../context/AuthContext';

export default function NurseDashboard() {
  const { user, logout } = useAuth();
  return (
    <main className="container" style={{ padding: '4rem 1.5rem' }}>
      <h1>Nurse/Triage Dashboard</h1>
      <p>Signed in as {user?.email}.</p>
      <p>Clinical triage and vital workflows will be implemented in Phase 6.</p>
      <button className="btn" onClick={logout}>Log out</button>
    </main>
  );
}
