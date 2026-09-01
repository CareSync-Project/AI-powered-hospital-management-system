import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NurseDashboard from './pages/NurseDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './index.css';
import './patient.css';

const DASHBOARDS={SUPER_ADMIN:'/super-admin-dashboard',PATIENT:'/patient-dashboard',DOCTOR:'/doctor-dashboard',NURSE:'/nurse-dashboard',ADMIN:'/admin-dashboard'};
const ProtectedRoute=({children,allowedRoles})=>{const{user,isLoading}=useAuth();if(isLoading)return <main className="route-message"><h1>Loading CareSync…</h1><p>Restoring your secure session.</p></main>;if(!user)return <Navigate to="/" replace/>;if(allowedRoles&&!allowedRoles.includes(user.role))return <Navigate to="/access-denied" replace state={{attemptedRole:allowedRoles[0]}}/>;return children;};
function AccessDenied(){const{user,logout}=useAuth(),navigate=useNavigate(),destination=DASHBOARDS[user?.role]||'/';return <main className="route-message"><h1>Access denied</h1><p>You are signed in as <strong>{user?.role||'an unauthenticated user'}</strong>. Each clinical dashboard is restricted to its authorised role.</p><div><button onClick={()=>navigate(destination,{replace:true})}>Go to my dashboard</button>{user&&<button className="secondary" onClick={async()=>{await logout();navigate('/',{replace:true})}}>Sign in with another account</button>}</div></main>}
function NotFound(){const{user,isLoading}=useAuth();if(isLoading)return <main className="route-message"><h1>Loading CareSync…</h1></main>;return <main className="route-message"><h1>Page not found</h1><p>The requested page does not exist or belongs to an older prototype route.</p><a href={user?DASHBOARDS[user.role]||'/':'/'}>Return to {user?'my dashboard':'the home page'}</a></main>}
function App(){return <AppErrorBoundary><AuthProvider><NotificationProvider><BrowserRouter><Routes><Route path="/" element={<LandingPage/>}/><Route path="/super-admin-dashboard" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard/></ProtectedRoute>}/><Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard/></ProtectedRoute>}/><Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard/></ProtectedRoute>}/><Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard/></ProtectedRoute>}/><Route path="/nurse-dashboard" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseDashboard/></ProtectedRoute>}/><Route path="/access-denied" element={<AccessDenied/>}/><Route path="*" element={<NotFound/>}/></Routes></BrowserRouter></NotificationProvider></AuthProvider></AppErrorBoundary>}
export default App;
