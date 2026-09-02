import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
          maxWidth: '600px',
          margin: '2rem auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.85rem',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#991b1b', margin: '0 0 0.5rem 0', fontWeight: '700' }}>
            Section View Error
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this section.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              padding: '0.65rem 1.4rem',
              backgroundColor: '#004449',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={16} /> Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
