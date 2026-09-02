const LABELS = { PENDING: 'Pending Confirmation', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed', VERIFIED: 'Verified', REJECTED: 'Rejected' };
export default function StatusBadge({ status }) {
  return <span className={`patient-badge patient-badge--${String(status).toLowerCase()}`}>{LABELS[status] || String(status).replaceAll('_', ' ')}</span>;
}
