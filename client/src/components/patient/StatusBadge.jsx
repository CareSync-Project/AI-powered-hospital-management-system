import React from 'react';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  PENDING: { label: 'Pending', bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  IN_PROGRESS: { label: 'In Progress', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  WAITING: { label: 'Waiting in Clinic', bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  COMPLETED: { label: 'Completed', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  MISSED: { label: 'Missed / No Show', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  CANCELLED: { label: 'Cancelled', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  VERIFIED: { label: 'Verified', bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
};

export default function StatusBadge({ status }) {
  const conf = STATUS_CONFIG[status] || {
    label: String(status || 'Unknown').replaceAll('_', ' '),
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '700',
      backgroundColor: conf.bg,
      color: conf.text,
      border: `1px solid ${conf.border}`,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      {conf.label}
    </span>
  );
}
