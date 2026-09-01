import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Types: 'email', 'sms', 'system'
  const addNotification = useCallback((type, message, recipient) => {
    const newNotification = {
      id: Date.now().toString(),
      type,
      message,
      recipient,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Automatically remove after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 8000);
  }, []);

  const simulateAppointmentNotifications = useCallback((patientName, doctorName, date, time) => {
    // Simulate SMS to patient
    addNotification('sms', `Appointment Confirmed: You are scheduled with Dr. ${doctorName} on ${date} at ${time}.`, patientName);
    
    // Simulate Email to Doctor
    setTimeout(() => {
      addNotification('email', `New Booking: ${patientName} has been added to your queue for ${date} at ${time}.`, `Dr. ${doctorName}`);
    }, 1500);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, simulateAppointmentNotifications }}>
      {children}
      
      {/* Global Notification Overlay */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 9999, pointerEvents: 'none' }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{ 
            background: 'var(--color-surface)', 
            border: '1px solid var(--glass-border)', 
            padding: '1rem 1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            width: '320px',
            animation: 'slideIn 0.3s ease-out forwards',
            pointerEvents: 'auto'
          }}>
            <div style={{ 
              background: notif.type === 'sms' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: notif.type === 'sms' ? 'var(--color-success)' : 'var(--color-primary)',
              padding: '0.5rem',
              borderRadius: '8px',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {notif.type === 'sms' ? '📱' : '✉️'}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                {notif.type.toUpperCase()} to {notif.recipient}
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                {notif.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
