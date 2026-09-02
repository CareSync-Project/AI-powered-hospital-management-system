import React from 'react';

export default function PossibleConditionCard({ item }) {
  if (!item) return null;

  const strength = item.matchStrength ? String(item.matchStrength).replaceAll('_', ' ') : 'Possible Match';
  const name = item.displayName || item.name || 'Medical Condition';
  const reason = item.shortReason || item.reason || item.description || '';
  const matched = Array.isArray(item.matchedSymptoms)
    ? item.matchedSymptoms.join(', ')
    : (typeof item.matchedSymptoms === 'string' ? item.matchedSymptoms : 'Reported symptoms');

  return (
    <article style={{
      padding: '0.85rem 1rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#004449', margin: 0 }}>
          {name}
        </h4>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: '700',
          padding: '0.1rem 0.45rem',
          borderRadius: '999px',
          backgroundColor: '#f1f5f9',
          color: '#007A83',
          textTransform: 'uppercase'
        }}>
          {strength}
        </span>
      </div>

      {reason && (
        <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
          {reason}
        </p>
      )}

      {matched && (
        <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
          <strong>Matched:</strong> {matched}
        </small>
      )}
    </article>
  );
}
