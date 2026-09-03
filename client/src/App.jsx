import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NurseDashboard from './pages/NurseDashboard';
import './index.css';
import './patient.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#004449', fontWeight: '700', fontSize: '1.1rem' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              <Route 
                path="/patient-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/doctor-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/nurse-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['NURSE']}>
                    <NurseDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route
                path="/access-denied"
                element={<ProtectedRoute>
                  <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#004449', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '2.5rem 3rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
                      <h1 style={{ color: '#dc2626', fontSize: '1.75rem', marginBottom: '0.75rem' }}>Access Denied</h1>
                      <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Your account does not have permission to access that specific portal dashboard.
                      </p>
                      <a href="/" style={{ display: 'inline-block', padding: '0.65rem 1.5rem', backgroundColor: '#004449', color: '#ffffff', borderRadius: '8px', fontWeight: '700', textDecoration: 'none' }}>
                        Return to Home
                      </a>
                    </div>
                  </main>
                </ProtectedRoute>}
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
